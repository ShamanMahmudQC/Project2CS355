const darkBtn = document.getElementById("darkModeBtn");
const body = document.body;

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

const leaderboardBody = document.getElementById("leaderboardBody");

fetch("/api/leaderboard")
  .then((res) => res.json())
  .then((data) => {
    leaderboardBody.innerHTML = "";
    data.forEach((entry) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${entry.user}</td>
        <td>${entry.score}</td>
        <td>${new Date(entry.date).toLocaleString()}</td>
      `;
      leaderboardBody.appendChild(tr);
    });
  });
