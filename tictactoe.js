const cells = document.querySelectorAll(".cell");
const statusText = document.getElementById("status");
const restartButton = document.getElementById("restart");

let board = ["", "", "", "", "", "", "", "", ""];

const PLAYER = "X";
const BOT = "O";

let gameOver = false;
let botThinking = false;

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


// =========================
// PLAYER MOVE
// =========================

cells.forEach((cell) => {
    cell.addEventListener("click", () => {

        if (gameOver || botThinking) {
            return;
        }

        const index = Number(cell.dataset.index);

        // Don't allow clicking an occupied square
        if (board[index] !== "") {
            return;
        }

        makeMove(index, PLAYER);

        // Check if player won
        if (checkWinner(board, PLAYER)) {
            statusText.textContent = "You win! 🎉";
            gameOver = true;
            return;
        }

        // Check for draw
        if (isBoardFull(board)) {
            statusText.textContent = "It's a draw! 🤝";
            gameOver = true;
            return;
        }

        // Bot's turn
        botThinking = true;
        statusText.textContent = "Bot is thinking...";

        // Small delay makes the bot feel more natural
        setTimeout(() => {
            botMove();
        }, 400);
    });
});


// =========================
// MAKE MOVE
// =========================

function makeMove(index, player) {
    board[index] = player;

    cells[index].textContent = player;
    cells[index].classList.add(player.toLowerCase());

    cells[index].disabled = true;
}


// =========================
// BOT MOVE
// =========================

function botMove() {

    if (gameOver) {
        return;
    }

    const bestMove = getBestMove();

    if (bestMove !== -1) {
        makeMove(bestMove, BOT);
    }

    // Check if bot won
    if (checkWinner(board, BOT)) {
        statusText.textContent = "The bot wins! 🤖";
        gameOver = true;
        botThinking = false;
        return;
    }

    // Check for draw
    if (isBoardFull(board)) {
        statusText.textContent = "It's a draw! 🤝";
        gameOver = true;
        botThinking = false;
        return;
    }

    botThinking = false;
    statusText.textContent = "Your turn — You are X";
}


// =========================
// BOT AI
// =========================

function getBestMove() {

    // 1. Can the bot win?
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


    // 2. Can the player win next?
    // Block them.
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


    // 3. Take the center
    if (board[4] === "") {
        return 4;
    }


    // 4. Take a corner
    const corners = [0, 2, 6, 8];

    const availableCorners = corners.filter(
        (index) => board[index] === ""
    );

    if (availableCorners.length > 0) {
        return availableCorners[
            Math.floor(Math.random() * availableCorners.length)
        ];
    }


    // 5. Take any remaining space
    const availableSpaces = [];

    for (let i = 0; i < 9; i++) {
        if (board[i] === "") {
            availableSpaces.push(i);
        }
    }

    if (availableSpaces.length > 0) {
        return availableSpaces[
            Math.floor(Math.random() * availableSpaces.length)
        ];
    }

    return -1;
}


// =========================
// CHECK WINNER
// =========================

function checkWinner(currentBoard, player) {

    return winningCombinations.some((combination) => {

        const [a, b, c] = combination;

        return (
            currentBoard[a] === player &&
            currentBoard[b] === player &&
            currentBoard[c] === player
        );
    });
}


// =========================
// CHECK DRAW
// =========================

function isBoardFull(currentBoard) {
    return currentBoard.every((square) => square !== "");
}


// =========================
// RESTART GAME
// =========================

restartButton.addEventListener("click", restartGame);

function restartGame() {

    board = ["", "", "", "", "", "", "", "", ""];

    gameOver = false;
    botThinking = false;

    cells.forEach((cell) => {
        cell.textContent = "";
        cell.classList.remove("x", "o");
        cell.disabled = false;
    });

    statusText.textContent = "Your turn — You are X";
}