
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

const darkBtn = document.getElementById("darkModeBtn");
const body = document.body;
const questionNumber = document.getElementById("questionNumber");
const questionText = document.getElementById("questionText");
const choicesDiv = document.getElementById("choices");
const timerDiv = document.getElementById("timer");
const nextBtn = document.getElementById("nextBtn");

let darkMode = false;
function updateDarkMode() {
  if (localStorage.getItem("darkMode") === "true") {
    body.classList.add("dark-mode");
    body.classList.remove("light-mode");
  } else {
    body.classList.add("light-mode");
    body.classList.remove("dark-mode");
  }
}

darkBtn.onclick = () => {
  const isDark = body.classList.contains("dark-mode");
  localStorage.setItem("darkMode", !isDark);
  updateDarkMode();
};

updateDarkMode();

let questions = [];
let currentIndex = 0;
let score = 0;
let answers = [];
let timer;
let timeLeft = 0;
const timePerQuestion = parseInt(getQueryParam("time")) || 15;

function fetchQuestions() {
  const num = parseInt(getQueryParam("num")) || 5;
  return fetch(`/api/questions?count=${num}`).then((res) => res.json());
}

function startTimer() {
  timeLeft = timePerQuestion;
  timerDiv.textContent = `Time left: ${timeLeft}s`;
  timer = setInterval(() => {
    timeLeft--;
    timerDiv.textContent = `Time left: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      selectAnswer(null);
    }
  }, 1000);
}

function showQuestion() {
  if (currentIndex >= questions.length) {
    showResults();
    return;
  }

  questionNumber.textContent = `Question ${currentIndex + 1} / ${questions.length}`;
  const q = questions[currentIndex];
  questionText.textContent = q.question;

  choicesDiv.innerHTML = "";
  ["A", "B", "C", "D"].forEach((ch) => {
    const btn = document.createElement("button");
    btn.className = "list-group-item list-group-item-action";
    btn.textContent = `${ch}: ${q[ch]}`;
    btn.dataset.letter = ch;
    btn.onclick = () => selectAnswer(ch);
    choicesDiv.appendChild(btn);
  });

  nextBtn.disabled = true;
  startTimer();
}

function selectAnswer(letter) {
  clearInterval(timer);
  const q = questions[currentIndex];
  const correct = q.answer;


  answers.push({
    question: q.question,
    selected: letter,
    correct: correct,
    choices: { A: q.A, B: q.B, C: q.C, D: q.D },
  });

  if (letter === correct) score++;


  [...choicesDiv.children].forEach((btn) => {
    btn.disabled = true;
    if (btn.dataset.letter === letter) {
      btn.classList.add(letter === correct ? "list-group-item-success" : "list-group-item-danger");
    }
    if (btn.dataset.letter === correct && letter !== correct) {
      btn.classList.add("list-group-item-success");
    }
  });

  nextBtn.disabled = false;
}

nextBtn.onclick = () => {
  currentIndex++;
  showQuestion();
};

function showResults() {

  sessionStorage.setItem(
    "quizResults",
    JSON.stringify({ score, total: questions.length, answers })
  );


  fetch("/api/quiz-result", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ score, total: questions.length, answers }),
  }).then(() => {
    window.location.href = "/results.html";
  });
}


fetchQuestions().then((data) => {
  questions = data;
  showQuestion();
});
