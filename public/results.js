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

const scoreDiv = document.getElementById("score");
const incorrectDiv = document.getElementById("incorrect-questions");
const playAgainBtn = document.getElementById("playAgainBtn");

const results = JSON.parse(sessionStorage.getItem("quizResults"));

if (!results) {
  scoreDiv.textContent = "No results found.";
} else {
  scoreDiv.textContent = `Score: ${results.score} / ${results.total}`;

  const incorrect = results.answers.filter((a) => a.selected !== a.correct);
  if (incorrect.length === 0) {
    incorrectDiv.innerHTML = "<p>Great job! All correct.</p>";
  } else {
    incorrect.forEach((a) => {
      const div = document.createElement("div");
      div.className = "card mb-3 p-3";
      div.innerHTML = `
        <p><strong>Q:</strong> ${a.question}</p>
        <p><strong>Your answer:</strong> ${a.selected ? a.selected + ": " + a.choices[a.selected] : "No answer"}</p>
        <p><strong>Correct answer:</strong> ${a.correct}: ${a.choices[a.correct]}</p>
      `;
      incorrectDiv.appendChild(div);
    });
  }
}

playAgainBtn.onclick = () => {
  sessionStorage.removeItem("quizResults");
  window.location.href = "/home";
};
