const express = require("express");
const path = require("path");
const fs = require("fs");
const session = require("express-session");
const crypto = require("crypto");

const app = express();
const port = 3000;

const questionsPath = path.join(__dirname, "data", "questions.json");
const usersPath = path.join(__dirname, "data", "users.json");
const leaderboardPath = path.join(__dirname, "data", "leaderboard.json");

const questions = JSON.parse(fs.readFileSync(questionsPath, "utf-8"));

function hashPassword(password, salt, callback) {
  const keyLength = 32;
  crypto.scrypt(password, salt, keyLength, callback);
}

function verifyPassword(password, salt, hashedPassword, callback) {
  hashPassword(password, salt, (err, derivedKey) => {
    if (err) return callback(err);
    const isMatch = derivedKey.toString('hex') === hashedPassword;
    callback(null, isMatch);
  });
}



function loadUsers() {
  try {
    if (fs.existsSync(usersPath)) {
      return JSON.parse(fs.readFileSync(usersPath, "utf-8"));
    }
  } catch (error) {
    console.error("Error loading users:", error);
  }
  return {};
}

function saveUsers(users) {
  try {
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving users:", error);
    return false;
  }
}



function loadLeaderboard() {
  try {
    if (fs.existsSync(leaderboardPath)) {
      return JSON.parse(fs.readFileSync(leaderboardPath, "utf-8"));
    }
  } catch (error) {
    console.error("Error loading leaderboard:", error);
  }
  return [];
}

function saveLeaderboard(leaderboard) {
  try {
    fs.writeFileSync(leaderboardPath, JSON.stringify(leaderboard, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving leaderboard:", error);
    return false;
  }
}

let users = loadUsers();
let leaderboard = loadLeaderboard();

if (Object.keys(users).length === 0) {
  console.log("Creating default users...");
  
  const defaultUserData = [
    { username: "test", password: "test" }
  ];
  
  defaultUserData.forEach(({ username, password }) => {
    const salt = crypto.randomUUID(); 
    hashPassword(password, salt, (err, derivedKey) => {
      if (err) {
        console.error(`Error creating user ${username}:`, err);
        return;
      }
      users[username] = {
        salt: salt,
        hash: derivedKey.toString('hex')
      };
      
      if (Object.keys(users).length === defaultUserData.length) {
        saveUsers(users);
        console.log("Default users created: test, password test");
      }
    });
  });
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: crypto.randomUUID(), 
    resave: false,
    saveUninitialized: false,
  })
);

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

app.get("/", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  else res.redirect("/home");
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  users = loadUsers();
  
  if (users[username]) {
    const { salt, hash } = users[username];
    verifyPassword(password, salt, hash, (err, isMatch) => {
      if (err) {
        console.error("Password verification error:", err);
        return res.redirect("/login?error=1");
      }
      
      if (isMatch) {
        req.session.user = { username };
        res.redirect("/home");
      } else {
        res.redirect("/login?error=1");
      }
    });
  } else {
    res.redirect("/login?error=1");
  }
});

app.post("/register", (req, res) => {
  const { username, password, confirmPassword } = req.body;
  
  users = loadUsers();

  if (!username || !password || !confirmPassword) {
    return res.redirect("/register?error=missing");
  }
  
  if (password !== confirmPassword) {
    return res.redirect("/register?error=mismatch");
  }
  
  if (password.length < 4) {
    return res.redirect("/register?error=short");
  }
  
  if (users[username]) {
    return res.redirect("/register?error=exists");
  }
  
  const salt = crypto.randomUUID();
  hashPassword(password, salt, (err, derivedKey) => {
    if (err) {
      console.error("Password hashing error:", err);
      return res.redirect("/register?error=save");
    }
    
    users[username] = {
      salt: salt,
      hash: derivedKey.toString('hex')
    };
    
    if (saveUsers(users)) {
      req.session.user = { username };
      res.redirect("/home");
    } else {
      res.redirect("/register?error=save");
    }
  });
});


app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});


app.get("/home", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.sendFile(path.join(__dirname, "public", "home.html"));
});


app.get("/quiz.html", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.sendFile(path.join(__dirname, "public", "quiz.html"));
});


app.get("/results.html", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.sendFile(path.join(__dirname, "public", "results.html"));
});


app.get("/leaderboard.html", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.sendFile(path.join(__dirname, "public", "leaderboard.html"));
});










app.get("/api/questions", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Unauthorized" });
  let count = parseInt(req.query.count) || 5;
  if (count > questions.length) count = questions.length;

  const shuffled = questions.sort(() => 0.5 - Math.random()).slice(0, count);
  res.json(shuffled);
});


app.post("/api/quiz-result", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Unauthorized" });
  const { score, total, answers } = req.body;
  

  leaderboard = loadLeaderboard();
  
  leaderboard.push({
    user: req.session.user.username,
    score,
    total,
    date: new Date().toISOString(),
  });
  

  saveLeaderboard(leaderboard);
  
  res.json({ success: true });
});


app.get("/api/leaderboard", (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Unauthorized" });
  

  leaderboard = loadLeaderboard();
  
  const top = leaderboard
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  res.json(top);
});


app.get("/api/users", (req, res) => {
  if (!req.session.user || req.session.user.username !== "test") {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  users = loadUsers();
  const userList = Object.keys(users).map(username => ({ username }));
  res.json(userList);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Users file: ${usersPath}`);
  console.log(`Leaderboard file: ${leaderboardPath}`);
});