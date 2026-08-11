/* ========================================
THEME TOGGLE
======================================== */

const themeToggle = document.getElementById("themeToggle");

const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {

document.body.classList.add("dark-mode");

themeToggle.textContent = "○";

themeToggle.setAttribute(
"aria-pressed",
"true"
);

}

themeToggle.addEventListener("click", () => {

const isDark =
document.body.classList.toggle("dark-mode");

themeToggle.textContent =
isDark ? "○" : "◐";

themeToggle.setAttribute(
"aria-pressed",
isDark ? "true" : "false"
);

localStorage.setItem(
"theme",
isDark ? "dark" : "light"
);

});

/* ========================================
CHESS GAME
======================================== */

const chessGameButton =
document.getElementById("chessGameButton");

const backToGames =
document.getElementById("backToGames");

const gameList =
document.getElementById("gameList");

const gameScreen =
document.getElementById("gameScreen");

const gameFrame =
document.getElementById("gameFrame");

/* ========================================
OPEN CHESS
======================================== */

chessGameButton.addEventListener("click", () => {

// Hide the game selection
gameList.hidden = true;

// Show the game screen
gameScreen.hidden = false;

// Load chess.html
gameFrame.src = "chess.html";

// Move the page to the chess game
gameScreen.scrollIntoView({
behavior: "smooth",
block: "start"
});

});

/* ========================================
BACK TO GAMES
======================================== */

backToGames.addEventListener("click", () => {

// Hide the chess game
gameScreen.hidden = true;

// Show the game selection
gameList.hidden = false;

// Stop the chess game
gameFrame.src = "";

// Return to the game list
gameList.scrollIntoView({
behavior: "smooth",
block: "start"
});

});

/* ========================================
CURRENT YEAR
======================================== */

const year =
document.getElementById("year");

if (year) {

year.textContent =
new Date().getFullYear();

}
