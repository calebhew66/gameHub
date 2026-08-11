const boardElement = document.getElementById("board");
const statusText = document.getElementById("status");
const restartButton = document.getElementById("restart");

let board = ["", "", "", "", "", "", "", ""];

const PLAYER = "X";
const BOT = "O";

let gameOver = false;
let botThinking = false;
let winRecorded = false;

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
// RENDER
// ============================================================

function renderBoard() {
    const cells = boardElement.children;

    for (let i = 0; i < 9; i++) {
        const cell = cells[i];

        if (!cell) {
            console.error("Missing cell:", i);
            continue;
        }

        cell.textContent = board[i];

        cell.classList.remove("x", "o");

        if (board[i] === PLAYER) {
            cell.classList.add("x");
        }

        if (board[i] === BOT) {
            cell.classList.add("o");
        }
    }
}

// ============================================================
// PLAYER CLICK
// ============================================================

boardElement.addEventListener("click", function (event) {

    const cell = event.target.closest(".cell");

    if (!cell) {
        return;
    }

    const index = parseInt(
        cell.getAttribute("data-index"),
        10
    );

    console.log("CLICKED CELL:", index);

    if (
        Number.isNaN(index) ||
        index < 0 ||
        index > 8
    ) {
        console.error("Invalid cell index:", index);
        return;
    }

    if (gameOver) {
        return;
    }

    if (botThinking) {
        return;
    }

    if (board[index] !== "") {
        return;
    }

    // Player move
    board[index] = PLAYER;

    renderBoard();

    // Player wins
    if (checkWinner(board, PLAYER)) {
        statusText.textContent = "You win! 🎉";
        gameOver = true;

        recordTicTacToeWin();

        return;
    }

    // Draw
    if (isBoardFull(board)) {
        statusText.textContent = "It's a draw! 🤝";
        gameOver = true;

        return;
    }

    // Bot turn
    botThinking = true;
    statusText.textContent = "Bot is thinking...";

    setTimeout(botMove, 400);
});

// ============================================================
// BOT
// ============================================================

function botMove() {

    if (gameOver) {
        return;
    }

    const move = getBestMove();

    if (move !== -1) {
        board[move] = BOT;
    }

    renderBoard();

    if (checkWinner(board, BOT)) {
        statusText.textContent = "The bot wins! 🤖";
        gameOver = true;
        botThinking = false;
        return;
    }

    if (isBoardFull(board)) {
        statusText.textContent = "It's a draw! 🤝";
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

    // Bot can win
    for (let i = 0; i < 9; i++) {

        if (board[i] === "") {

            board[i] = BOT;

            if (checkWinner(board, BOT)) {
                board[i] = "";
                return i;
            }

            board[i] = "";
        }
    }

    // Block player
    for (let i = 0; i < 9; i++) {

        if (board[i] === "") {

            board[i] = PLAYER;

            if (checkWinner(board, PLAYER)) {
                board[i] = "";
                return i;
            }

            board[i] = "";
        }
    }

    // Center
    if (board[4] === "") {
        return 4;
    }

    // Corners
    const corners = [0, 2, 6, 8];

    const availableCorners =
        corners.filter(
            index => board[index] === ""
        );

    if (availableCorners.length > 0) {
        return availableCorners[
            Math.floor(
                Math.random() *
                availableCorners.length
            )
        ];
    }

    // Any remaining space
    const available = [];

    for (let i = 0; i < 9; i++) {
        if (board[i] === "") {
            available.push(i);
        }
    }

    if (available.length > 0) {
        return available[
            Math.floor(
                Math.random() *
                available.length
            )
        ];
    }

    return -1;
}

// ============================================================
// WINNER
// ============================================================

function checkWinner(currentBoard, player) {

    return winningCombinations.some(
        combination => {

            const [a, b, c] =
                combination;

            return (
                currentBoard[a] === player &&
                currentBoard[b] === player &&
                currentBoard[c] === player
            );
        }
    );
}

// ============================================================
// DRAW
// ============================================================

function isBoardFull(currentBoard) {

    return currentBoard.every(
        square => square !== ""
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

    renderBoard();

    statusText.textContent =
        "Your turn — You are X";
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

        const { createClient } =
            await import("./lib/supabase.js");

        const supabase =
            createClient();

        let username =
            localStorage.getItem(
                "chgames_username"
            );

        if (!username) {

            username =
                prompt(
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
                error
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

            if (error) {
                console.error(
                    "Error updating wins:",
                    error
                );

                winRecorded = false;
                return;
            }

        } else {

            const {
                error
            } = await supabase
                .from("player_stats")
                .insert({
                    username: username,
                    checkers_wins: 0,
                    tictactoe_wins: 1,
                    total_wins: 1
                });

            if (error) {
                console.error(
                    "Error creating player:",
                    error
                );

                winRecorded = false;
                return;
            }
        }

        console.log(
            "Tic-Tac-Toe win recorded!"
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
// START
// ============================================================

renderBoard();