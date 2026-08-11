"use strict";

// ============================================================
// DOM
// ============================================================

const cells = document.querySelectorAll(".cell");
const statusText = document.getElementById("status");
const restartButton = document.getElementById("restart");

// Make sure all 9 cells exist
console.log("Tic-Tac-Toe cells found:", cells.length);

// ============================================================
// GAME STATE
// ============================================================

let board = [
"",
"",
"",
"",
"",
"",
"",
""
];

const PLAYER = "X";
const BOT = "O";

let gameOver = false;
let botThinking = false;
let winRecorded = false;

// ============================================================
// WINNING COMBINATIONS
// ============================================================

const winningCombinations = [
[0, 1, 2],
[3, 4, 5],
[6, 7, 8],


[0, 3, 6],
[1, 4, 7],
[2, 5, 8],

[0, 4, 8],
[2, 4, 6]


];

// ============================================================
// USERNAME
// ============================================================

function getUsername() {


let username =
    localStorage.getItem("chgames_username");

if (!username) {

    username =
        prompt("Enter your CHgames username:");

    if (!username) {
        username = "Player";
    }

    username =
        username.trim().slice(0, 20);

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

// ============================================================
// SUPABASE
// ============================================================

async function recordTicTacToeWin() {


if (winRecorded) {
    return;
}

winRecorded = true;

try {

    const {
        createClient
    } = await import("./lib/supabase.js");

    const supabase =
        createClient();

    const username =
        getUsername();

    const {
        data: existingPlayer,
        error: selectError
    } = await supabase
        .from("player_stats")
        .select(
            "id, username, checkers_wins, tictactoe_wins"
        )
        .eq(
            "username",
            username
        )
        .maybeSingle();

    if (selectError) {

        console.error(
            "Error finding player:",
            selectError
        );

        winRecorded = false;
        return;
    }

    // ====================================================
    // PLAYER EXISTS
    // ====================================================

    if (existingPlayer) {

        const checkersWins =
            Number(
                existingPlayer.checkers_wins || 0
            );

        const ticTacToeWins =
            Number(
                existingPlayer.tictactoe_wins || 0
            ) + 1;

        const totalWins =
            checkersWins +
            ticTacToeWins;

        const {
            error: updateError
        } = await supabase
            .from("player_stats")
            .update({
                tictactoe_wins:
                    ticTacToeWins,

                total_wins:
                    totalWins
            })
            .eq(
                "id",
                existingPlayer.id
            );

        if (updateError) {

            console.error(
                "Error updating Tic-Tac-Toe wins:",
                updateError
            );

            winRecorded = false;
            return;
        }

        console.log(
            "Tic-Tac-Toe win recorded!"
        );

        return;
    }

    // ====================================================
    // PLAYER DOESN'T EXIST
    // ====================================================

    const {
        error: insertError
    } = await supabase
        .from("player_stats")
        .insert({
            username: username,
            checkers_wins: 0,
            tictactoe_wins: 1,
            total_wins: 1
        });

    if (insertError) {

        console.error(
            "Error creating player:",
            insertError
        );

        winRecorded = false;
        return;
    }

    console.log(
        "Player created and Tic-Tac-Toe win recorded!"
    );

} catch (error) {

    console.error(
        "Supabase error:",
        error
    );

    winRecorded = false;
}


}

// ============================================================
// PLAYER MOVE
// ============================================================

cells.forEach((cell) => {


cell.addEventListener("click", () => {

    if (gameOver || botThinking) {
        return;
    }

    const index =
        Number(
            cell.dataset.index
        );

    console.log(
        "Clicked cell:",
        index
    );

    // Cell already occupied
    if (board[index] !== "") {
        return;
    }

    // Player makes move
    makeMove(
        index,
        PLAYER
    );

    // ====================================================
    // PLAYER WON
    // ====================================================

    if (
        checkWinner(
            board,
            PLAYER
        )
    ) {

        statusText.textContent =
            "You win! 🎉";

        gameOver = true;

        recordTicTacToeWin();

        return;
    }

    // ====================================================
    // DRAW
    // ====================================================

    if (
        isBoardFull(board)
    ) {

        statusText.textContent =
            "It's a draw! 🤝";

        gameOver = true;

        return;
    }

    // ====================================================
    // BOT TURN
    // ====================================================

    botThinking = true;

    statusText.textContent =
        "Bot is thinking...";

    setTimeout(() => {

        botMove();

    }, 400);

});


});

// ============================================================
// MAKE MOVE
// ============================================================

function makeMove(
index,
player
) {


if (
    index < 0 ||
    index > 8
) {
    return;
}

board[index] =
    player;

cells[index].textContent =
    player;

cells[index].classList.remove(
    "x",
    "o"
);

cells[index].classList.add(
    player.toLowerCase()
);

cells[index].disabled =
    true;


}

// ============================================================
// BOT MOVE
// ============================================================

function botMove() {


if (gameOver) {
    return;
}

const bestMove =
    getBestMove();

if (bestMove !== -1) {

    makeMove(
        bestMove,
        BOT
    );
}

// ========================================================
// BOT WON
// ========================================================

if (
    checkWinner(
        board,
        BOT
    )
) {

    statusText.textContent =
        "The bot wins! 🤖";

    gameOver = true;
    botThinking = false;

    return;
}

// ========================================================
// DRAW
// ========================================================

if (
    isBoardFull(board)
) {

    statusText.textContent =
        "It's a draw! 🤝";

    gameOver = true;
    botThinking = false;

    return;
}

botThinking = false;

statusText.textContent =
    "Your turn — You are X";

}

// ============================================================
// BOT AI
// ============================================================

function getBestMove() {


// ========================================================
// 1. BOT CAN WIN
// ========================================================

for (
    let i = 0;
    i < 9;
    i++
) {

    if (board[i] === "") {

        board[i] = BOT;

        if (
            checkWinner(
                board,
                BOT
            )
        ) {

            board[i] = "";

            return i;
        }

        board[i] = "";
    }
}

// ========================================================
// 2. BLOCK PLAYER
// ========================================================

for (
    let i = 0;
    i < 9;
    i++
) {

    if (board[i] === "") {

        board[i] = PLAYER;

        if (
            checkWinner(
                board,
                PLAYER
            )
        ) {

            board[i] = "";

            return i;
        }

        board[i] = "";
    }
}

// ========================================================
// 3. CENTER
// ========================================================

if (board[4] === "") {
    return 4;
}

// ========================================================
// 4. CORNERS
// ========================================================

const corners = [
    0,
    2,
    6,
    8
];

const availableCorners =
    corners.filter(
        (index) =>
            board[index] === ""
    );

if (
    availableCorners.length > 0
) {

    return availableCorners[
        Math.floor(
            Math.random() *
            availableCorners.length
        )
    ];
}

// ========================================================
// 5. ANY REMAINING SPACE
// ========================================================

const availableSpaces = [];

for (
    let i = 0;
    i < 9;
    i++
) {

    if (board[i] === "") {
        availableSpaces.push(i);
    }
}

if (
    availableSpaces.length > 0
) {

    return availableSpaces[
        Math.floor(
            Math.random() *
            availableSpaces.length
        )
    ];
}

return -1;


}

// ============================================================
// CHECK WINNER
// ============================================================

function checkWinner(
currentBoard,
player
) {


return winningCombinations.some(
    (combination) => {

        const [
            a,
            b,
            c
        ] = combination;

        return (
            currentBoard[a] === player &&
            currentBoard[b] === player &&
            currentBoard[c] === player
        );
    }
);


}

// ============================================================
// CHECK DRAW
// ============================================================

function isBoardFull(
currentBoard
) {


return currentBoard.every(
    (square) =>
        square !== ""
);


}

// ============================================================
// RESTART
// ============================================================

restartButton.addEventListener(
"click",
restartGame
);

function restartGame() {


board = [
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    ""
];

gameOver = false;
botThinking = false;
winRecorded = false;

cells.forEach(
    (cell) => {

        cell.textContent = "";

        cell.classList.remove(
            "x",
            "o"
        );

        cell.disabled = false;
    }
);

statusText.textContent =
    "Your turn — You are X";


}
