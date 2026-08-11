
/* ========================================
SUPABASE
======================================== */

// IMPORTANT:
// Use your Supabase PROJECT URL here.
// Use your Supabase PUBLISHABLE KEY here.
// NEVER use your service-role/secret key.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://ijtclttmxnckpieqkaki.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_ntobIYEBKNJI3tPpfD_izQ_xLJ-n7UL";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


/* ========================================
THEME TOGGLE
======================================== */

const themeToggle =
  document.getElementById("themeToggle");

const savedTheme =
  localStorage.getItem("theme");

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
GAME ELEMENTS
======================================== */

const chessGameButton =
  document.getElementById("chessGameButton");

const ticTacToeGameButton =
  document.getElementById("ticTacToeGameButton");

const backToGames =
  document.getElementById("backToGames");

const gameList =
  document.getElementById("gameList");

const gameScreen =
  document.getElementById("gameScreen");

const gameFrame =
  document.getElementById("gameFrame");

const gameScreenTitle =
  document.getElementById("gameScreenTitle");


/* ========================================
OPEN CHESS
======================================== */

chessGameButton.addEventListener("click", () => {

  gameList.hidden = true;

  gameScreen.hidden = false;

  gameScreenTitle.textContent = "Chess";

  gameFrame.src = "chess.html";

  gameScreen.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

});


/* ========================================
OPEN TIC-TAC-TOE
======================================== */

ticTacToeGameButton.addEventListener("click", () => {

  gameList.hidden = true;

  gameScreen.hidden = false;

  gameScreenTitle.textContent = "Tic-Tac-Toe";

  gameFrame.src = "tictactoe.html";

  gameScreen.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

});


/* ========================================
BACK TO GAMES
======================================== */

backToGames.addEventListener("click", () => {

  gameScreen.hidden = true;

  gameList.hidden = false;

  gameFrame.src = "";

  gameList.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

});


/* ========================================
LEADERBOARD
======================================== */

const leaderboardList =
  document.getElementById("leaderboardList");


async function loadLeaderboard() {

  leaderboardList.innerHTML = `
    <div class="leaderboard__loading">
      Loading leaderboard...
    </div>
  `;

  try {

    const { data, error } = await supabase
      .from("player_stats")
      .select(
        "username, chess_wins, tictactoe_wins, total_wins"
      )
      .order("total_wins", {
        ascending: false
      })
      .limit(10);


    if (error) {
      throw error;
    }


    if (!data || data.length === 0) {

      leaderboardList.innerHTML = `
        <div class="leaderboard__empty">
          No players yet.
        </div>
      `;

      return;
    }


    leaderboardList.innerHTML = "";


    data.forEach((player, index) => {

      const rank =
        index + 1;

      const playerElement =
        document.createElement("div");

      playerElement.className =
        `leaderboard__player rank-${rank}`;


      playerElement.innerHTML = `
        <span class="leaderboard__rank">
          #${rank}
        </span>

        <div>
          <div class="leaderboard__player-name">
            ${escapeHTML(player.username)}
          </div>

          <div class="leaderboard__games">
            ♟ ${player.chess_wins} &nbsp;&nbsp;
            ❌ ${player.tictactoe_wins}
          </div>
        </div>

        <div class="leaderboard__total">
          ${player.total_wins}

          <span class="leaderboard__total-label">
            WINS
          </span>
        </div>
      `;


      leaderboardList.appendChild(
        playerElement
      );

    });

  } catch (error) {

    console.error(
      "Leaderboard error:",
      error
    );

    leaderboardList.innerHTML = `
      <div class="leaderboard__error">
        Unable to load leaderboard.
      </div>
    `;

  }

}


/* ========================================
ESCAPE HTML
======================================== */

function escapeHTML(value) {

  const div =
    document.createElement("div");

  div.textContent =
    value ?? "";

  return div.innerHTML;

}


/* ========================================
CURRENT YEAR
======================================== */

const year =
  document.getElementById("year");

if (year) {

  year.textContent =
    new Date().getFullYear();

}


/* ========================================
LOAD LEADERBOARD
======================================== */

loadLeaderboard();

