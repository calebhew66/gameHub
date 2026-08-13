import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

(function () {

"use strict";

/* =========================================================
SUPABASE
========================================================= */

const supabaseUrl =
  "https://ijtclttmxnckpieqkaki.supabase.co";

const supabaseKey =
  "sb_publishable_ntobIYEBKNJI3tPpfD_izQ_xLJ-n7UL";

const supabase =
  createClient(
    supabaseUrl,
    supabaseKey
  );


/* =========================================================
USERNAME
========================================================= */

function getUsername() {

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


/* =========================================================
RECORD CHESS WIN
========================================================= */

async function recordChessWin() {

  const username =
    getUsername();

  let winsToAdd = 1;

  if (difficulty === "medium") {

    winsToAdd = 2;

  } else if (difficulty === "hard") {

    winsToAdd = 5;

  }


  console.log(
    `Chess win: ${username} earned ${winsToAdd} win(s) on ${difficulty}.`
  );


  try {

    /*
     * First check if the player already exists.
     */

    const {
      data: existingPlayer,
      error: selectError
    } = await supabase

      .from("player_stats")

      .select(
        "username, chess_wins, total_wins"
      )

      .eq(
        "username",
        username
      )

      .maybeSingle();


    if (selectError) {

      console.error(
        "Could not find player:",
        selectError
      );

      return;

    }


    /*
     * Player already exists.
     */

    if (existingPlayer) {

      const newChessWins =
        Number(
          existingPlayer.chess_wins || 0
        ) + winsToAdd;


      const newTotalWins =
        Number(
          existingPlayer.total_wins || 0
        ) + winsToAdd;


      const {
        error: updateError
      } = await supabase

        .from("player_stats")

        .update({

          chess_wins:
            newChessWins,

          total_wins:
            newTotalWins

        })

        .eq(
          "username",
          username
        );


      if (updateError) {

        console.error(
          "Could not update Chess wins:",
          updateError
        );

        return;

      }


      console.log(
        `Updated ${username}: +${winsToAdd} Chess wins.`
      );

      return;

    }


    /*
     * Player doesn't exist yet.
     * Create their player_stats row.
     */

    const {
      error: insertError
    } = await supabase

      .from("player_stats")

      .insert({

        username:
          username,

        checkers_wins:
          0,

        tictactoe_wins:
          0,

        chess_wins:
          winsToAdd,

        total_wins:
          winsToAdd

      });


    if (insertError) {

      console.error(
        "Could not create player stats:",
        insertError
      );

      return;

    }


    console.log(
      `Created ${username} with +${winsToAdd} Chess win(s).`
    );

  } catch (error) {

    console.error(
      "Unexpected Supabase error:",
      error
    );

  }

}


/* =========================================================
STATE
========================================================= */

let board = [];

let playerColor = "white";

let botColor = "black";

let difficulty = null;

let currentTurn = "white";

let selected = null;

let legalTargets = [];

let gameOver = false;

let animationLock = false;

let pendingPromotion = null;

let enPassantTarget = null;

let lastMove = null;

let castlingRights = {

  whiteKing: true,

  whiteQueen: true,

  blackKing: true,

  blackQueen: true

};

let capturedBlack = [];

let capturedWhite = [];

let colorChoice = null;

let difficultyChoice = null;


/* =========================================================
DOM
========================================================= */

const setupScreen =
  document.getElementById(
    "setup-screen"
  );

const gameScreen =
  document.getElementById(
    "game-screen"
  );

const boardEl =
  document.getElementById(
    "board"
  );

const statusEl =
  document.getElementById(
    "status"
  );

const turnLabel =
  document.getElementById(
    "turn-label"
  );

const turnDot =
  document.getElementById(
    "turn-dot"
  );

const newGameBtn =
  document.getElementById(
    "new-game-btn"
  );

const startBtn =
  document.getElementById(
    "start-btn"
  );

const overlay =
  document.getElementById(
    "game-over-overlay"
  );

const overlayText =
  document.getElementById(
    "game-over-text"
  );

const playAgainBtn =
  document.getElementById(
    "play-again-btn"
  );

const promotionOverlay =
  document.getElementById(
    "promotion-overlay"
  );

const capturedBlackEl =
  document.getElementById(
    "captured-black"
  );

const capturedWhiteEl =
  document.getElementById(
    "captured-white"
  );

const chatPanel =
  document.getElementById(
    "chat-panel"
  );

const chatMessages =
  document.getElementById(
    "chat-messages"
  );

const chatInput =
  document.getElementById(
    "chat-input"
  );

const chatSend =
  document.getElementById(
    "chat-send"
  );


/* =========================================================
PIECES
========================================================= */

const PIECES = {

  white: {

    k: "♔",

    q: "♕",

    r: "♖",

    b: "♗",

    n: "♘",

    p: "♙"

  },

  black: {

    k: "♚",

    q: "♛",

    r: "♜",

    b: "♝",

    n: "♞",

    p: "♟"

  }

};


const PIECE_VALUES = {

  p: 100,

  n: 320,

  b: 330,

  r: 500,

  q: 900,

  k: 20000

};


/* =========================================================
SETUP
========================================================= */

document
  .querySelectorAll(
    ".color-option"
  )
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".color-option"
            )
            .forEach(
              (b) => {

                b.classList.remove(
                  "selected"
                );

              }
            );


          button.classList.add(
            "selected"
          );


          colorChoice =
            button.dataset.color;


          checkStartReady();

        }
      );

    }
  );


document
  .querySelectorAll(
    ".difficulty-option"
  )
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".difficulty-option"
            )
            .forEach(
              (b) => {

                b.classList.remove(
                  "selected"
                );

              }
            );


          button.classList.add(
            "selected"
          );


          difficultyChoice =
            button.dataset.difficulty;


          checkStartReady();

        }
      );

    }
  );


function checkStartReady() {

  startBtn.disabled =
    !(
      colorChoice &&
      difficultyChoice
    );

}


startBtn.addEventListener(
  "click",
  () => {

    playerColor =
      colorChoice === "random"
        ? (
            Math.random() < 0.5
              ? "white"
              : "black"
          )
        : colorChoice;


    botColor =
      playerColor === "white"
        ? "black"
        : "white";


    difficulty =
      difficultyChoice;


    startGame();

  }
);


newGameBtn.addEventListener(
  "click",
  backToSetup
);


playAgainBtn.addEventListener(
  "click",
  backToSetup
);


function backToSetup() {

  gameScreen.classList.add(
    "hidden"
  );


  setupScreen.classList.remove(
    "hidden"
  );


  chatPanel.classList.add(
    "hidden"
  );


  overlay.classList.add(
    "hidden"
  );


  promotionOverlay.classList.add(
    "hidden"
  );


  animationLock = false;

  pendingPromotion = null;

  clearChat();

}


/* =========================================================
BOARD CREATION
========================================================= */

function createPiece(
  color,
  type
) {

  return {

    color,

    type,

    hasMoved: false

  };

}


function createEmptyBoard() {

  return Array
    .from(
      { length: 8 },
      () =>
        Array(8).fill(null)
    );

}


function initBoard() {

  const b =
    createEmptyBoard();


  const backRank = [

    "r",
    "n",
    "b",
    "q",
    "k",
    "b",
    "n",
    "r"

  ];


  for (
    let c = 0;
    c < 8;
    c++
  ) {

    b[0][c] =
      createPiece(
        "black",
        backRank[c]
      );


    b[1][c] =
      createPiece(
        "black",
        "p"
      );


    b[6][c] =
      createPiece(
        "white",
        "p"
      );


    b[7][c] =
      createPiece(
        "white",
        backRank[c]
      );

  }


  return b;

}


function cloneBoard(bd) {

  return bd.map(
    row =>
      row.map(
        piece =>
          piece
            ? { ...piece }
            : null
      )
  );

}


function inBounds(
  r,
  c
) {

  return (

    r >= 0 &&

    r < 8 &&

    c >= 0 &&

    c < 8

  );

}


/* =========================================================
ATTACK DETECTION
========================================================= */

function findKing(
  bd,
  color
) {

  for (
    let r = 0;
    r < 8;
    r++
  ) {

    for (
      let c = 0;
      c < 8;
      c++
    ) {

      const piece =
        bd[r][c];


      if (

        piece &&

        piece.color === color &&

        piece.type === "k"

      ) {

        return {
          r,
          c
        };

      }

    }

  }


  return null;

}


function isSquareAttacked(
  bd,
  r,
  c,
  byColor
) {

  const pawnDir =
    byColor === "white"
      ? -1
      : 1;


  const pawnRow =
    r - pawnDir;


  for (
    const dc of [-1, 1]
  ) {

    const pc =
      c - dc;


    if (
      inBounds(
        pawnRow,
        pc
      )
    ) {

      const piece =
        bd[pawnRow][pc];


      if (

        piece &&

        piece.color === byColor &&

        piece.type === "p"

      ) {

        return true;

      }

    }

  }


  const knightMoves = [

    [-2, -1],

    [-2, 1],

    [-1, -2],

    [-1, 2],

    [1, -2],

    [1, 2],

    [2, -1],

    [2, 1]

  ];


  for (
    const [dr, dc]
    of knightMoves
  ) {

    const nr = r + dr;

    const nc = c + dc;


    if (
      !inBounds(nr, nc)
    ) {

      continue;

    }


    const piece =
      bd[nr][nc];


    if (

      piece &&

      piece.color === byColor &&

      piece.type === "n"

    ) {

      return true;

    }

  }


  const diagonalDirs = [

    [-1, -1],

    [-1, 1],

    [1, -1],

    [1, 1]

  ];


  for (
    const [dr, dc]
    of diagonalDirs
  ) {

    let nr = r + dr;

    let nc = c + dc;


    while (
      inBounds(nr, nc)
    ) {

      const piece =
        bd[nr][nc];


      if (piece) {

        if (

          piece.color === byColor &&

          (

            piece.type === "b" ||

            piece.type === "q"

          )

        ) {

          return true;

        }


        break;

      }


      nr += dr;

      nc += dc;

    }

  }


  const straightDirs = [

    [-1, 0],

    [1, 0],

    [0, -1],

    [0, 1]

  ];


  for (
    const [dr, dc]
    of straightDirs
  ) {

    let nr = r + dr;

    let nc = c + dc;


    while (
      inBounds(nr, nc)
    ) {

      const piece =
        bd[nr][nc];


      if (piece) {

        if (

          piece.color === byColor &&

          (

            piece.type === "r" ||

            piece.type === "q"

          )

        ) {

          return true;

        }


        break;

      }


      nr += dr;

      nc += dc;

    }

  }


  for (
    const dr of [-1, 0, 1]
  ) {

    for (
      const dc of [-1, 0, 1]
    ) {

      if (

        dr === 0 &&

        dc === 0

      ) {

        continue;

      }


      const nr = r + dr;

      const nc = c + dc;


      if (
        !inBounds(nr, nc)
      ) {

        continue;

      }


      const piece =
        bd[nr][nc];


      if (

        piece &&

        piece.color === byColor &&

        piece.type === "k"

      ) {

        return true;

      }

    }

  }


  return false;

}


function isInCheck(
  bd,
  color
) {

  const king =
    findKing(
      bd,
      color
    );


  if (!king) {

    return true;

  }


  const enemy =
    color === "white"
      ? "black"
      : "white";


  return isSquareAttacked(
    bd,
    king.r,
    king.c,
    enemy
  );

}


/* =========================================================
PSEUDO LEGAL MOVES
========================================================= */

function generatePseudoMoves(
  bd,
  r,
  c
) {

  const piece =
    bd[r][c];


  if (!piece) {

    return [];

  }


  const moves = [];


  function addMove(
    nr,
    nc,
    extra = {}
  ) {

    if (
      !inBounds(
        nr,
        nc
      )
    ) {

      return;

    }


    const target =
      bd[nr][nc];


    if (

      target &&

      target.color === piece.color

    ) {

      return;

    }


    if (

      target &&

      target.type === "k"

    ) {

      return;

    }


    moves.push({

      from: {
        r,
        c
      },

      to: {
        r: nr,
        c: nc
      },

      ...extra

    });

  }


  /* PAWN */

  if (
    piece.type === "p"
  ) {

    const dir =
      piece.color === "white"
        ? -1
        : 1;


    const startRow =
      piece.color === "white"
        ? 6
        : 1;


    const promotionRow =
      piece.color === "white"
        ? 0
        : 7;


    const oneR =
      r + dir;


    if (

      inBounds(
        oneR,
        c
      ) &&

      !bd[oneR][c]

    ) {

      addMove(
        oneR,
        c,
        {
          promotion:
            oneR === promotionRow
        }
      );


      const twoR =
        r + dir * 2;


      if (

        r === startRow &&

        !bd[twoR][c]

      ) {

        addMove(
          twoR,
          c,
          {
            pawnDouble: true
          }
        );

      }

    }


    for (
      const dc of [-1, 1]
    ) {

      const nr =
        r + dir;

      const nc =
        c + dc;


      if (
        !inBounds(
          nr,
          nc
        )
      ) {

        continue;

      }


      const target =
        bd[nr][nc];


      if (

        target &&

        target.color !== piece.color &&

        target.type !== "k"

      ) {

        addMove(
          nr,
          nc,
          {
            promotion:
              nr === promotionRow
          }
        );

      }


      if (

        enPassantTarget &&

        enPassantTarget.r === nr &&

        enPassantTarget.c === nc

      ) {

        addMove(
          nr,
          nc,
          {
            enPassant: true
          }
        );

      }

    }

  }


  /* KNIGHT */

  if (
    piece.type === "n"
  ) {

    const dirs = [

      [-2, -1],

      [-2, 1],

      [-1, -2],

      [-1, 2],

      [1, -2],

      [1, 2],

      [2, -1],

      [2, 1]

    ];


    for (
      const [dr, dc]
      of dirs
    ) {

      addMove(
        r + dr,
        c + dc
      );

    }

  }


  /* BISHOP */

  if (

    piece.type === "b" ||

    piece.type === "q"

  ) {

    const dirs = [

      [-1, -1],

      [-1, 1],

      [1, -1],

      [1, 1]

    ];


    for (
      const [dr, dc]
      of dirs
    ) {

      addSlidingMoves(
        bd,
        r,
        c,
        dr,
        dc,
        moves
      );

    }

  }


  /* ROOK */

  if (

    piece.type === "r" ||

    piece.type === "q"

  ) {

    const dirs = [

      [-1, 0],

      [1, 0],

      [0, -1],

      [0, 1]

    ];


    for (
      const [dr, dc]
      of dirs
    ) {

      addSlidingMoves(
        bd,
        r,
        c,
        dr,
        dc,
        moves
      );

    }

  }


  /* KING */

  if (
    piece.type === "k"
  ) {

    for (
      const dr of [-1, 0, 1]
    ) {

      for (
        const dc of [-1, 0, 1]
      ) {

        if (

          dr === 0 &&

          dc === 0

        ) {

          continue;

        }


        addMove(
          r + dr,
          c + dc
        );

      }

    }


    /* CASTLING */

    if (

      !piece.hasMoved &&

      !isInCheck(
        bd,
        piece.color
      )

    ) {

      const enemy =
        piece.color === "white"
          ? "black"
          : "white";


      /* KING SIDE */

      const kingSide =
        piece.color === "white"
          ? castlingRights.whiteKing
          : castlingRights.blackKing;


      if (

        kingSide &&

        !bd[r][5] &&

        !bd[r][6] &&

        bd[r][7] &&

        bd[r][7].type === "r" &&

        bd[r][7].color === piece.color &&

        !isSquareAttacked(
          bd,
          r,
          5,
          enemy
        ) &&

        !isSquareAttacked(
          bd,
          r,
          6,
          enemy
        )

      ) {

        moves.push({

          from: {
            r,
            c
          },

          to: {
            r,
            c: 6
          },

          castle: "king"

        });

      }


      /* QUEEN SIDE */

      const queenSide =
        piece.color === "white"
          ? castlingRights.whiteQueen
          : castlingRights.blackQueen;


      if (

        queenSide &&

        !bd[r][1] &&

        !bd[r][2] &&

        !bd[r][3] &&

        bd[r][0] &&

        bd[r][0].type === "r" &&

        bd[r][0].color === piece.color &&

        !isSquareAttacked(
          bd,
          r,
          3,
          enemy
        ) &&

        !isSquareAttacked(
          bd,
          r,
          2,
          enemy
        )

      ) {

        moves.push({

          from: {
            r,
            c
          },

          to: {
            r,
            c: 2
          },

          castle: "queen"

        });

      }

    }

  }


  return moves;

}


function addSlidingMoves(
  bd,
  r,
  c,
  dr,
  dc,
  moves
) {

  const piece =
    bd[r][c];


  let nr =
    r + dr;

  let nc =
    c + dc;


  while (
    inBounds(
      nr,
      nc
    )
  ) {

    const target =
      bd[nr][nc];


    if (!target) {

      moves.push({

        from: {
          r,
          c
        },

        to: {
          r: nr,
          c: nc
        }

      });

    } else {

      if (

        target.color !==
        piece.color &&

        target.type !== "k"

      ) {

        moves.push({

          from: {
            r,
            c
          },

          to: {
            r: nr,
            c: nc
          }

        });

      }


      break;

    }


    nr += dr;

    nc += dc;

  }

}


/* =========================================================
APPLY MOVE TO A BOARD
========================================================= */

function applyMove(
  bd,
  move
) {

  const nb =
    cloneBoard(bd);


  const piece =
    nb[
      move.from.r
    ][
      move.from.c
    ];


  if (!piece) {

    return nb;

  }


  nb[
    move.from.r
  ][
    move.from.c
  ] = null;


  /* EN PASSANT */

  if (
    move.enPassant
  ) {

    const captureR =
      move.from.r;


    nb[
      captureR
    ][
      move.to.c
    ] = null;

  }


  /* CASTLING */

  if (
    move.castle
  ) {

    if (
      move.to.c === 6
    ) {

      const rook =
        nb[
          move.from.r
        ][7];


      nb[
        move.from.r
      ][7] = null;


      nb[
        move.from.r
      ][5] = rook;

    }


    if (
      move.to.c === 2
    ) {

      const rook =
        nb[
          move.from.r
        ][0];


      nb[
        move.from.r
      ][0] = null;


      nb[
        move.from.r
      ][3] = rook;

    }

  }


  const newPiece = {

    ...piece,

    hasMoved: true

  };


  nb[
    move.to.r
  ][
    move.to.c
  ] = newPiece;


  return nb;

}


/* =========================================================
LEGAL MOVES
========================================================= */

function generateLegalMoves(
  bd,
  color
) {

  const legal = [];


  for (
    let r = 0;
    r < 8;
    r++
  ) {

    for (
      let c = 0;
      c < 8;
      c++
    ) {

      const piece =
        bd[r][c];


      if (

        !piece ||

        piece.color !== color

      ) {

        continue;

      }


      const pseudo =
        generatePseudoMoves(
          bd,
          r,
          c
        );


      for (
        const move of pseudo
      ) {

        const testBoard =
          applyMove(
            bd,
            move
          );


        if (
          !isInCheck(
            testBoard,
            color
          )
        ) {

          legal.push(
            move
          );

        }

      }

    }

  }


  return legal;

}


function movesForSquare(
  r,
  c
) {

  return generateLegalMoves(
    board,
    currentTurn
  ).filter(
    move =>
      move.from.r === r &&
      move.from.c === c
  );

}


/* =========================================================
PLAYER INPUT
========================================================= */

function onSquareClick(
  r,
  c
) {

  if (

    gameOver ||

    animationLock ||

    currentTurn !== playerColor ||

    pendingPromotion

  ) {

    return;

  }


  const target =
    legalTargets.find(
      move =>
        move.to.r === r &&
        move.to.c === c
    );


  if (

    selected &&

    target

  ) {

    makePlayerMove(
      target
    );

    return;

  }


  const piece =
    board[r][c];


  if (

    !piece ||

    piece.color !== playerColor

  ) {

    clearSelection();

    return;

  }


  const moves =
    movesForSquare(
      r,
      c
    );


  if (
    moves.length === 0
  ) {

    clearSelection();

    return;

  }


  selected = {
    r,
    c
  };


  legalTargets =
    moves;


  renderBoard();

}


function clearSelection() {

  selected = null;

  legalTargets = [];

  renderBoard();

}


/* =========================================================
PLAYER MOVE
========================================================= */

function makePlayerMove(
  move
) {

  if (
    animationLock
  ) {

    return;

  }


  const captured =
    getCapturedPiece(
      board,
      move
    );


  if (captured) {

    if (
      captured.color === "black"
    ) {

      capturedBlack.push(
        captured.type
      );

    } else {

      capturedWhite.push(
        captured.type
      );

    }

  }


  board =
    applyMove(
      board,
      move
    );


  updateCastlingRights(
    move,
    captured
  );


  updateEnPassant(
    move
  );


  lastMove =
    move;


  selected = null;

  legalTargets = [];


  renderBoard();

  renderCaptured();


  if (
    move.promotion
  ) {

    pendingPromotion = {
      move
    };


    promotionOverlay.classList.remove(
      "hidden"
    );


    animationLock = true;

    return;

  }


  finishMove(
    move
  );

}


function finishMove(
  move
) {

  animationLock = false;


  const movingPiece =
    board[
      move.to.r
    ][
      move.to.c
    ];


  if (

    movingPiece &&

    movingPiece.type === "p"

  ) {

    if (

      move.to.r === 0 ||

      move.to.r === 7

    ) {

      showPromotion();

      return;

    }

  }


  switchTurn();

}


/* =========================================================
PROMOTION
========================================================= */

document
  .querySelectorAll(
    ".promotion-btn"
  )
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          if (
            !pendingPromotion
          ) {

            return;

          }


          const type =
            button.dataset.piece;


          const move =
            pendingPromotion.move;


          board[
            move.to.r
          ][
            move.to.c
          ].type = type;


          promotionOverlay.classList.add(
            "hidden"
          );


          pendingPromotion = null;

          animationLock = false;


          renderBoard();


          taphReact(
            "promotion"
          );


          switchTurn();

        }
      );

    }
  );


function showPromotion() {

  promotionOverlay.classList.remove(
    "hidden"
  );

}


/* =========================================================
CAPTURES
========================================================= */

function getCapturedPiece(
  bd,
  move
) {

  if (
    move.enPassant
  ) {

    return bd[
      move.from.r
    ][
      move.to.c
    ];

  }


  return bd[
    move.to.r
  ][
    move.to.c
  ];

}


function renderCaptured() {

  capturedBlackEl.innerHTML =
    "";


  capturedWhiteEl.innerHTML =
    "";


  capturedBlack.forEach(
    type => {

      const span =
        document.createElement(
          "span"
        );


      span.className =
        "captured-piece black";


      span.textContent =
        PIECES.black[type];


      capturedBlackEl.appendChild(
        span
      );

    }
  );


  capturedWhite.forEach(
    type => {

      const span =
        document.createElement(
          "span"
        );


      span.className =
        "captured-piece white";


      span.textContent =
        PIECES.white[type];


      capturedWhiteEl.appendChild(
        span
      );

    }
  );

}


/* =========================================================
CASTLING RIGHTS
========================================================= */

function updateCastlingRights(
  move,
  captured
) {

  const piece =
    board[
      move.to.r
    ][
      move.to.c
    ];


  if (!piece) {

    return;

  }


  if (
    piece.type === "k"
  ) {

    if (
      piece.color === "white"
    ) {

      castlingRights.whiteKing =
        false;

      castlingRights.whiteQueen =
        false;

    } else {

      castlingRights.blackKing =
        false;

      castlingRights.blackQueen =
        false;

    }

  }


  if (
    piece.type === "r"
  ) {

    if (
      piece.color === "white"
    ) {

      if (

        move.from.r === 7 &&

        move.from.c === 0

      ) {

        castlingRights.whiteQueen =
          false;

      }


      if (

        move.from.r === 7 &&

        move.from.c === 7

      ) {

        castlingRights.whiteKing =
          false;

      }

    } else {

      if (

        move.from.r === 0 &&

        move.from.c === 0

      ) {

        castlingRights.blackQueen =
          false;

      }


      if (

        move.from.r === 0 &&

        move.from.c === 7

      ) {

        castlingRights.blackKing =
          false;

      }

    }

  }


  if (

    captured &&

    captured.type === "r"

  ) {

    if (

      move.to.r === 7 &&

      move.to.c === 0

    ) {

      castlingRights.whiteQueen =
        false;

    }


    if (

      move.to.r === 7 &&

      move.to.c === 7

    ) {

      castlingRights.whiteKing =
        false;

    }


    if (

      move.to.r === 0 &&

      move.to.c === 0

    ) {

      castlingRights.blackQueen =
        false;

    }


    if (

      move.to.r === 0 &&

      move.to.c === 7

    ) {

      castlingRights.blackKing =
        false;

    }

  }

}


/* =========================================================
EN PASSANT
========================================================= */

function updateEnPassant(
  move
) {

  enPassantTarget = null;


  const piece =
    board[
      move.to.r
    ][
      move.to.c
    ];


  if (

    piece &&

    piece.type === "p" &&

    Math.abs(
      move.to.r -
      move.from.r
    ) === 2

  ) {

    enPassantTarget = {

      r:
        (
          move.to.r +
          move.from.r
        ) / 2,

      c:
        move.to.c

    };

  }

}


/* =========================================================
TURN FLOW
========================================================= */

function switchTurn() {

  currentTurn =
    currentTurn === "white"
      ? "black"
      : "white";


  selected = null;

  legalTargets = [];


  renderBoard();


  const result =
    getGameResult();


  if (result) {

    handleGameOver(
      result
    );

    return;

  }


  updateStatus();


  if (
    currentTurn === botColor
  ) {

    taphReact(
      "botThinking"
    );


    setTimeout(
      botMove,
      difficulty === "hard"
        ? 500
        : 650
    );

  } else {

    taphReact(
      "yourTurn"
    );

  }

}


function getGameResult() {

  const legalMoves =
    generateLegalMoves(
      board,
      currentTurn
    );


  if (
    legalMoves.length > 0
  ) {

    return null;

  }


  if (
    isInCheck(
      board,
      currentTurn
    )
  ) {

    return {

      type:
        "checkmate",

      winner:
        currentTurn === "white"
          ? "black"
          : "white"

    };

  }


  return {

    type:
      "stalemate",

    winner:
      null

  };

}


function updateStatus() {

  if (gameOver) {

    statusEl.textContent =
      "Game over";

    return;

  }


  const check =
    isInCheck(
      board,
      currentTurn
    );


  if (
    currentTurn === playerColor
  ) {

    statusEl.textContent =
      check
        ? "You're in check!"
        : "Your move";

  } else {

    statusEl.textContent =
      check
        ? "Bot is in check!"
        : "Bot is thinking…";

  }


  const name =
    currentTurn === "white"
      ? "White"
      : "Black";


  turnLabel.textContent =
    `${name} to move`;


  turnDot.classList.toggle(
    "white",
    currentTurn === "white"
  );

}


/* =========================================================
BOT AI
========================================================= */

function botMove() {

  if (

    gameOver ||

    currentTurn !== botColor

  ) {

    return;

  }


  animationLock = true;


  const legalMoves =
    generateLegalMoves(
      board,
      botColor
    );


  if (
    legalMoves.length === 0
  ) {

    animationLock = false;


    const result =
      getGameResult();


    if (result) {

      handleGameOver(
        result
      );

    }


    return;

  }


  let chosen;


  if (
    difficulty === "easy"
  ) {

    chosen =
      chooseEasyMove(
        legalMoves
      );

  } else if (
    difficulty === "medium"
  ) {

    chosen =
      chooseMediumMove(
        legalMoves
      );

  } else {

    chosen =
      chooseHardMove(
        legalMoves
      );

  }


  makeBotMove(
    chosen
  );

}


function chooseEasyMove(
  moves
) {

  return moves[
    Math.floor(
      Math.random() *
      moves.length
    )
  ];

}


function chooseMediumMove(
  moves
) {

  let bestScore =
    -Infinity;


  let bestMoves = [];


  for (
    const move of moves
  ) {

    const score =
      evaluateMove(
        board,
        move,
        botColor
      );


    if (
      score > bestScore
    ) {

      bestScore =
        score;

      bestMoves = [
        move
      ];

    } else if (
      score === bestScore
    ) {

      bestMoves.push(
        move
      );

    }

  }


  return bestMoves[
    Math.floor(
      Math.random() *
      bestMoves.length
    )
  ];

}


function chooseHardMove(
  moves
) {

  let bestScore =
    -Infinity;


  let bestMoves = [];


  for (
    const move of moves
  ) {

    const nextBoard =
      applyMove(
        board,
        move
      );


    const score =
      minimax(
        nextBoard,
        2,
        -Infinity,
        Infinity,
        false,
        botColor
      );


    if (
      score > bestScore
    ) {

      bestScore =
        score;

      bestMoves = [
        move
      ];

    } else if (
      score === bestScore
    ) {

      bestMoves.push(
        move
      );

    }

  }


  return bestMoves[
    Math.floor(
      Math.random() *
      bestMoves.length
    )
  ];

}


function evaluateMove(
  bd,
  move,
  color
) {

  const target =
    bd[
      move.to.r
    ][
      move.to.c
    ];


  let score = 0;


  if (target) {

    score +=
      PIECE_VALUES[
        target.type
      ];

  }


  if (
    move.promotion
  ) {

    score += 800;

  }


  if (
    move.castle
  ) {

    score += 50;

  }


  const next =
    applyMove(
      bd,
      move
    );


  if (
    isInCheck(
      next,
      color === "white"
        ? "black"
        : "white"
    )
  ) {

    score += 60;

  }


  score +=
    Math.random() * 10;


  return score;

}


function minimax(
  bd,
  depth,
  alpha,
  beta,
  maximizing,
  aiColor
) {

  const side =
    maximizing
      ? aiColor
      : (
          aiColor === "white"
            ? "black"
            : "white"
        );


  const moves =
    generateLegalMoves(
      bd,
      side
    );


  if (
    moves.length === 0
  ) {

    if (
      isInCheck(
        bd,
        side
      )
    ) {

      return maximizing
        ? -100000
        : 100000;

    }


    return 0;

  }


  if (
    depth === 0
  ) {

    return evaluateBoard(
      bd,
      aiColor
    );

  }


  if (maximizing) {

    let value =
      -Infinity;


    for (
      const move of moves
    ) {

      const next =
        applyMove(
          bd,
          move
        );


      value =
        Math.max(
          value,
          minimax(
            next,
            depth - 1,
            alpha,
            beta,
            false,
            aiColor
          )
        );


      alpha =
        Math.max(
          alpha,
          value
        );


      if (
        beta <= alpha
      ) {

        break;

      }

    }


    return value;

  }


  let value =
    Infinity;


  for (
    const move of moves
  ) {

    const next =
      applyMove(
        bd,
        move
      );


    value =
      Math.min(
        value,
        minimax(
          next,
          depth - 1,
          alpha,
          beta,
          true,
          aiColor
        )
      );


    beta =
      Math.min(
        beta,
        value
      );


    if (
      beta <= alpha
    ) {

      break;

    }

  }


  return value;

}


function evaluateBoard(
  bd,
  aiColor
) {

  let score = 0;


  for (
    let r = 0;
    r < 8;
    r++
  ) {

    for (
      let c = 0;
      c < 8;
      c++
    ) {

      const piece =
        bd[r][c];


      if (!piece) {

        continue;

      }


      let value =
        PIECE_VALUES[
          piece.type
        ];


      if (
        piece.type === "p"
      ) {

        const progress =
          piece.color === "white"
            ? 6 - r
            : r - 1;


        value +=
          progress * 8;

      }


      if (

        r >= 2 &&

        r <= 5 &&

        c >= 2 &&

        c <= 5

      ) {

        value += 5;

      }


      if (
        piece.color === aiColor
      ) {

        score += value;

      } else {

        score -= value;

      }

    }

  }


  return score;

}


/* =========================================================
BOT MOVE APPLICATION
========================================================= */

function makeBotMove(
  move
) {

  const captured =
    getCapturedPiece(
      board,
      move
    );


  if (captured) {

    if (
      captured.color === "black"
    ) {

      capturedBlack.push(
        captured.type
      );

    } else {

      capturedWhite.push(
        captured.type
      );

    }

  }


  board =
    applyMove(
      board,
      move
    );


  updateCastlingRights(
    move,
    captured
  );


  updateEnPassant(
    move
  );


  lastMove =
    move;


  renderBoard();

  renderCaptured();


  if (
    move.promotion
  ) {

    const piece =
      board[
        move.to.r
      ][
        move.to.c
      ];


    piece.type = "q";


    taphReact(
      "botPromotion"
    );

  }


  animationLock = false;


  switchTurn();

}


/* =========================================================
RENDER BOARD
========================================================= */

function renderBoard() {

  boardEl.innerHTML =
    "";


  const flipped =
    playerColor === "black";


  for (
    let displayR = 0;
    displayR < 8;
    displayR++
  ) {

    for (
      let displayC = 0;
      displayC < 8;
      displayC++
    ) {

      const r =
        flipped
          ? 7 - displayR
          : displayR;


      const c =
        flipped
          ? 7 - displayC
          : displayC;


      const square =
        document.createElement(
          "div"
        );


      square.className =
        "square " +
        (
          (r + c) % 2 === 1
            ? "dark"
            : "light"
        );


      if (

        selected &&

        selected.r === r &&

        selected.c === c

      ) {

        square.classList.add(
          "selected-square"
        );

      }


      if (

        lastMove &&

        (

          (

            lastMove.from.r === r &&

            lastMove.from.c === c

          ) ||

          (

            lastMove.to.r === r &&

            lastMove.to.c === c

          )

        )

      ) {

        square.classList.add(
          "last-move"
        );

      }


      const target =
        legalTargets.find(
          move =>
            move.to.r === r &&
            move.to.c === c
        );


      if (target) {

        square.classList.add(
          "legal-target"
        );


        if (

          board[r][c] ||

          target.enPassant

        ) {

          square.classList.add(
            "capture-target"
          );

        }

      }


      const piece =
        board[r][c];


      if (

        piece &&

        piece.type === "k" &&

        isInCheck(
          board,
          piece.color
        )

      ) {

        square.classList.add(
          "king-in-check"
        );

      }


      if (piece) {

        const pieceEl =
          document.createElement(
            "div"
          );


        pieceEl.className =
          `piece ${piece.color}`;


        pieceEl.textContent =
          PIECES[
            piece.color
          ][
            piece.type
          ];


        square.appendChild(
          pieceEl
        );

      }


      square.addEventListener(
        "click",
        () =>
          onSquareClick(
            r,
            c
          )
      );


      boardEl.appendChild(
        square
      );

    }

  }

}


/* =========================================================
GAME START
========================================================= */

function startGame() {

  board =
    initBoard();


  currentTurn =
    "white";


  selected = null;

  legalTargets = [];

  gameOver = false;

  animationLock = false;

  pendingPromotion = null;

  enPassantTarget = null;

  lastMove = null;


  castlingRights = {

    whiteKing: true,

    whiteQueen: true,

    blackKing: true,

    blackQueen: true

  };


  capturedBlack = [];

  capturedWhite = [];


  setupScreen.classList.add(
    "hidden"
  );


  gameScreen.classList.remove(
    "hidden"
  );


  chatPanel.classList.remove(
    "hidden"
  );


  overlay.classList.add(
    "hidden"
  );


  promotionOverlay.classList.add(
    "hidden"
  );


  clearChat();


  renderBoard();

  renderCaptured();

  updateStatus();


  addTaphMessage(
    "👀"
  );


  setTimeout(
    () => {

      addTaphMessage(

        playerColor === "white"

          ? "White goes first."

          : "You're Black. Good luck 😈"

      );

    },
    450
  );


  if (
    currentTurn === botColor
  ) {

    setTimeout(
      botMove,
      700
    );

  }

}


/* =========================================================
GAME OVER
========================================================= */

function handleGameOver(
  result
) {

  gameOver = true;


  if (
    result.type === "stalemate"
  ) {

    overlayText.textContent =
      "Stalemate";


    taphReact(
      "stalemate"
    );

  } else {

    const youWon =
      result.winner ===
      playerColor;


    overlayText.textContent =
      youWon
        ? "You win!"
        : "The bot wins";


    taphReact(
      youWon
        ? "win"
        : "lose"
    );


    /*
     * ONLY record a win when the player
     * actually defeated the bot.
     */

    if (youWon) {

      recordChessWin();

    }

  }


  overlay.classList.remove(
    "hidden"
  );


  updateStatus();

}


/* =========================================================
TAPH CHAT
========================================================= */

function clearChat() {

  chatMessages.innerHTML =
    "";

}


function addTaphMessage(
  text
) {

  const wrapper =
    document.createElement(
      "div"
    );


  wrapper.className =
    "chat-message taph-message";


  const avatar =
    document.createElement(
      "div"
    );


  avatar.className =
    "message-avatar";


  avatar.textContent =
    "T";


  const bubble =
    document.createElement(
      "div"
    );


  bubble.className =
    "message-bubble";


  bubble.textContent =
    text;


  wrapper.appendChild(
    avatar
  );


  wrapper.appendChild(
    bubble
  );


  chatMessages.appendChild(
    wrapper
  );


  chatMessages.scrollTop =
    chatMessages.scrollHeight;

}


function addPlayerMessage(
  text
) {

  const wrapper =
    document.createElement(
      "div"
    );


  wrapper.className =
    "chat-message player-message";


  const bubble =
    document.createElement(
      "div"
    );


  bubble.className =
    "message-bubble";


  bubble.textContent =
    text;


  wrapper.appendChild(
    bubble
  );


  chatMessages.appendChild(
    wrapper
  );


  chatMessages.scrollTop =
    chatMessages.scrollHeight;

}


function taphTyping(
  callback
) {

  const wrapper =
    document.createElement(
      "div"
    );


  wrapper.className =
    "chat-message taph-message";


  const avatar =
    document.createElement(
      "div"
    );


  avatar.className =
    "message-avatar";


  avatar.textContent =
    "T";


  const bubble =
    document.createElement(
      "div"
    );


  bubble.className =
    "message-bubble typing-bubble";


  for (
    let i = 0;
    i < 3;
    i++
  ) {

    const dot =
      document.createElement(
        "span"
      );


    bubble.appendChild(
      dot
    );

  }


  wrapper.appendChild(
    avatar
  );


  wrapper.appendChild(
    bubble
  );


  chatMessages.appendChild(
    wrapper
  );


  chatMessages.scrollTop =
    chatMessages.scrollHeight;


  setTimeout(
    () => {

      wrapper.remove();

      callback();

    },
    450
  );

}


function taphReact(
  event
) {

  const reactions = {

    playerCapture: [
      "💥",
      "👀",
      "🔥"
    ],

    botCapture: [
      "👀",
      "💀",
      "😂"
    ],

    check: [
      "CHECK.",
      "👀",
      "😳"
    ],

    botThinking: [
      "🤔",
      "👀",
      "..."
    ],

    yourTurn: [
      "👀",
      "👍"
    ],

    promotion: [
      "👑",
      "🔥",
      "😳"
    ],

    botPromotion: [
      "👑",
      "😰",
      "uh oh"
    ],

    win: [
      "🎉",
      "👑",
      "W"
    ],

    lose: [
      "💀",
      "😭",
      "gg"
    ],

    stalemate: [
      "🤨",
      "Draw.",
      "👀"
    ]

  };


  const choices =
    reactions[event];


  if (

    !choices ||

    choices.length === 0

  ) {

    return;

  }


  const message =
    choices[
      Math.floor(
        Math.random() *
        choices.length
      )
    ];


  taphTyping(
    () =>
      addTaphMessage(
        message
      )
  );

}


/* =========================================================
CHAT INPUT
========================================================= */

function sendChat() {

  const text =
    chatInput.value.trim();


  if (!text) {

    return;

  }


  addPlayerMessage(
    text
  );


  chatInput.value =
    "";


  setTimeout(
    () => {

      const lower =
        text.toLowerCase();


      if (

        lower.includes("hi") ||

        lower.includes("hello") ||

        lower.includes("hey")

      ) {

        taphReact(
          "yourTurn"
        );

        return;

      }


      if (
        lower.includes("check")
      ) {

        taphReact(
          "check"
        );

        return;

      }


      if (

        lower.includes("gg") ||

        lower.includes("good game")

      ) {

        taphReact(
          "win"
        );

        return;

      }


      const random = [

        "👀",

        "👍",

        "🤨",

        "😐",

        "...",

        "interesting"

      ];


      taphTyping(
        () =>
          addTaphMessage(
            random[
              Math.floor(
                Math.random() *
                random.length
              )
            ]
          )
      );

    },
    300
  );

}


chatSend.addEventListener(
  "click",
  sendChat
);


chatInput.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Enter"
    ) {

      sendChat();

    }

  }
);


/* =========================================================
UTILITY
========================================================= */

function wait(ms) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );

}

})();