/* ========================================
   SUPABASE
======================================== */

console.log("CHgames script.js loaded");

import {
    createClient
} from "https://esm.sh/@supabase/supabase-js@2";


const supabaseUrl =
    "https://ijtclttmxnckpieqkaki.supabase.co";


const supabaseKey =
    "sb_publishable_ntobIYEBKNJI3tPpfD_izQ_xLJ-n7UL";


const supabase =
    createClient(
        supabaseUrl,
        supabaseKey
    );


/* ========================================
   SHARED USERNAME
======================================== */

function getUsername() {

    let username =
        localStorage.getItem(
            "chgames_username"
        );

    if (!username) {

        username = prompt(
            "Enter your CHgames username:"
        );

        if (!username) {
            username = "Player";
        }

        username =
            username
                .trim()
                .slice(0, 20);

        if (!username) {
            username = "Player";
        }

        localStorage.setItem(
            "chgames_username",
            username
        );
    }

    return username;
}


/* ========================================
   ASK FOR USERNAME WHEN HUB LOADS
======================================== */

getUsername();


/* ========================================
   CHANGE USERNAME
======================================== */

const changeUsernameButton =
    document.getElementById(
        "changeUsernameButton"
    );


if (changeUsernameButton) {

    changeUsernameButton.addEventListener(
        "click",
        () => {

            const currentUsername =
                localStorage.getItem(
                    "chgames_username"
                );


            const newUsername =
                prompt(
                    "Enter your new CHgames username (changing username will not transfer data):",
                    currentUsername || ""
                );


            if (
                newUsername === null
            ) {

                return;

            }


            const cleanedUsername =
                newUsername
                    .trim()
                    .slice(0, 20);


            if (!cleanedUsername) {

                alert(
                    "Username cannot be empty."
                );

                return;

            }


            localStorage.setItem(
                "chgames_username",
                cleanedUsername
            );


            console.log(
                "Username changed to:",
                cleanedUsername
            );


            alert(
                `Username changed to "${cleanedUsername}".`
            );

        }
    );

}


/* ========================================
   THEME TOGGLE
======================================== */

const themeToggle =
    document.getElementById(
        "themeToggle"
    );


const savedTheme =
    localStorage.getItem(
        "theme"
    );


if (
    themeToggle &&
    savedTheme === "dark"
) {

    document.body.classList.add(
        "dark-mode"
    );


    themeToggle.textContent =
        "○";


    themeToggle.setAttribute(
        "aria-pressed",
        "true"
    );

}


if (themeToggle) {

    themeToggle.addEventListener(
        "click",
        () => {

            const isDark =
                document.body.classList.toggle(
                    "dark-mode"
                );


            themeToggle.textContent =
                isDark
                    ? "○"
                    : "◐";


            themeToggle.setAttribute(
                "aria-pressed",
                isDark
                    ? "true"
                    : "false"
            );


            localStorage.setItem(
                "theme",
                isDark
                    ? "dark"
                    : "light"
            );

        }
    );

}


/* ========================================
   GAME ELEMENTS
======================================== */

const chessGameButton =
    document.getElementById(
        "chessGameButton"
    );


const ticTacToeGameButton =
    document.getElementById(
        "ticTacToeGameButton"
    );


const chessGame3Button =
    document.getElementById(
        "chessGame3Button"
    );


const game4Button =
    document.getElementById(
        "game4Button"
    );


const backToGames =
    document.getElementById(
        "backToGames"
    );


const gameList =
    document.getElementById(
        "gameList"
    );


const gameScreen =
    document.getElementById(
        "gameScreen"
    );


const gameFrame =
    document.getElementById(
        "gameFrame"
    );


const gameScreenTitle =
    document.getElementById(
        "gameScreenTitle"
    );


/* ========================================
   OPEN CHECKERS
======================================== */

if (chessGameButton) {

    chessGameButton.addEventListener(
        "click",
        () => {

            gameList.hidden = true;

            gameScreen.hidden = false;


            gameScreenTitle.textContent =
                "Checkers";


            gameFrame.title =
                "Checkers game";


            gameFrame.src =
                "chess.html";


            gameScreen.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }
    );

}


/* ========================================
   OPEN TIC-TAC-TOE
======================================== */

if (ticTacToeGameButton) {

    ticTacToeGameButton.addEventListener(
        "click",
        () => {

            gameList.hidden = true;

            gameScreen.hidden = false;


            gameScreenTitle.textContent =
                "Tic-Tac-Toe";


            gameFrame.title =
                "Tic-Tac-Toe game";


            gameFrame.src =
                "tictactoe.html";


            gameScreen.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }
    );

}


/* ========================================
   OPEN CHESS
======================================== */

if (chessGame3Button) {

    chessGame3Button.addEventListener(
        "click",
        () => {

            gameList.hidden = true;

            gameScreen.hidden = false;


            gameScreenTitle.textContent =
                "Chess";


            gameFrame.title =
                "Chess game";


            gameFrame.src =
                "achess.html";


            gameScreen.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }
    );

}


/* ========================================
   OPEN DOTS & BOXES
======================================== */

if (game4Button) {

    game4Button.addEventListener(
        "click",
        () => {

            gameList.hidden = true;

            gameScreen.hidden = false;


            gameScreenTitle.textContent =
                "Dots & Boxes";


            gameFrame.title =
                "Dots & Boxes game";


            gameFrame.src =
                "dotsboxes.html";


            gameScreen.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }
    );

}


/* ========================================
   BACK TO GAMES
======================================== */

if (backToGames) {

    backToGames.addEventListener(
        "click",
        () => {

            gameScreen.hidden = true;

            gameList.hidden = false;

            gameFrame.src = "";


            gameList.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }
    );

}


/* ========================================
   LEADERBOARD ELEMENTS
======================================== */

const leaderboardButton =
    document.getElementById(
        "leaderboardButton"
    );


const leaderboardPanel =
    document.getElementById(
        "leaderboardPanel"
    );


const leaderboardOverlay =
    document.getElementById(
        "leaderboardOverlay"
    );


const closeLeaderboard =
    document.getElementById(
        "closeLeaderboard"
    );


const leaderboardList =
    document.getElementById(
        "leaderboardList"
    );


/* ========================================
   OPEN LEADERBOARD
======================================== */

async function openLeaderboard() {

    if (!leaderboardPanel) {
        return;
    }


    leaderboardPanel.classList.add(
        "is-open"
    );


    if (leaderboardOverlay) {

        leaderboardOverlay.hidden =
            false;

    }


    if (leaderboardButton) {

        leaderboardButton.setAttribute(
            "aria-expanded",
            "true"
        );

    }


    leaderboardPanel.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.style.overflow =
        "hidden";


    if (leaderboardOverlay) {

        requestAnimationFrame(() => {

            leaderboardOverlay.style.opacity =
                "1";

        });

    }


    await loadLeaderboard();

}


/* ========================================
   CLOSE LEADERBOARD
======================================== */

function closeLeaderboardPanel() {

    if (!leaderboardPanel) {
        return;
    }


    leaderboardPanel.classList.remove(
        "is-open"
    );


    if (leaderboardOverlay) {

        leaderboardOverlay.style.opacity =
            "0";

    }


    if (leaderboardButton) {

        leaderboardButton.setAttribute(
            "aria-expanded",
            "false"
        );

    }


    leaderboardPanel.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.style.overflow =
        "";


    setTimeout(() => {

        if (
            !leaderboardPanel.classList.contains(
                "is-open"
            )
        ) {

            if (leaderboardOverlay) {

                leaderboardOverlay.hidden =
                    true;

            }

        }

    }, 350);

}


/* ========================================
   LEADERBOARD EVENTS
======================================== */

if (leaderboardButton) {

    leaderboardButton.addEventListener(
        "click",
        openLeaderboard
    );

}


if (closeLeaderboard) {

    closeLeaderboard.addEventListener(
        "click",
        closeLeaderboardPanel
    );

}


if (leaderboardOverlay) {

    leaderboardOverlay.addEventListener(
        "click",
        closeLeaderboardPanel
    );

}


/* ========================================
   ESC KEY
======================================== */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            leaderboardPanel &&
            leaderboardPanel.classList.contains(
                "is-open"
            )
        ) {

            closeLeaderboardPanel();

        }

    }
);


/* ========================================
   LOAD LEADERBOARD
======================================== */

async function loadLeaderboard() {

    if (!leaderboardList) {
        return;
    }


    leaderboardList.innerHTML = `
        <div class="leaderboard__loading">
            Loading leaderboard...
        </div>
    `;


    try {

        const {
            data,
            error
        } =
            await supabase
                .from("player_stats")
                .select(
                    "username, checkers_wins, tictactoe_wins, chess_wins, dots_boxes_wins, total_wins"
                )
                .order(
                    "total_wins",
                    {
                        ascending: false
                    }
                )
                .limit(10);


        if (error) {

            console.error(
                "Leaderboard error:",
                error
            );


            leaderboardList.innerHTML = `
                <div class="leaderboard__error">
                    Could not load leaderboard.
                </div>
            `;


            return;

        }


        if (
            !data ||
            data.length === 0
        ) {

            leaderboardList.innerHTML = `
                <div class="leaderboard__empty">
                    No players yet.
                </div>
            `;


            return;

        }


        leaderboardList.innerHTML =
            data
                .map(
                    (player, index) => {

                        const rank =
                            index + 1;


                        return `
                            <div
                                class="leaderboard__player rank-${rank}"
                            >

                                <div
                                    class="leaderboard__rank"
                                >
                                    #${rank}
                                </div>


                                <div>

                                    <div
                                        class="leaderboard__player-name"
                                    >
                                        ${escapeHTML(
                                            player.username
                                        )}
                                    </div>


                                    <div
                                        class="leaderboard__games"
                                    >

                                        Checkers:
                                        ${Number(
                                            player.checkers_wins || 0
                                        )}

                                        &nbsp;•&nbsp;

                                        Tic-Tac-Toe:
                                        ${Number(
                                            player.tictactoe_wins || 0
                                        )}

                                        &nbsp;•&nbsp;

                                        Chess:
                                        ${Number(
                                            player.chess_wins || 0
                                        )}

                                        &nbsp;•&nbsp;

                                        Dots &amp; Boxes:
                                        ${Number(
                                            player.dots_boxes_wins || 0
                                        )}

                                    </div>

                                </div>


                                <div
                                    class="leaderboard__total"
                                >

                                    ${Number(
                                        player.total_wins || 0
                                    )}

                                    <span
                                        class="leaderboard__total-label"
                                    >
                                        WINS
                                    </span>

                                </div>

                            </div>
                        `;

                    }
                )
                .join("");

    } catch (error) {

        console.error(
            "Unexpected leaderboard error:",
            error
        );


        leaderboardList.innerHTML = `
            <div class="leaderboard__error">
                Could not load leaderboard.
            </div>
        `;

    }

}


/* ========================================
   HTML ESCAPE
======================================== */

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* ========================================
   CURRENT YEAR
======================================== */

const year =
    document.getElementById(
        "year"
    );


if (year) {

    year.textContent =
        new Date().getFullYear();

}


/* ========================================
   DEBUG
======================================== */

console.log(
    "Current CHgames username:",
    localStorage.getItem(
        "chgames_username"
    )
);

console.log(
    "CHgames Game Hub initialized successfully."
);