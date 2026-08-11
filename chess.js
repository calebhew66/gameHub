(function () {
    "use strict";
  
    // ============================================================
    // SUPABASE CHECKERS WIN TRACKING
    // ============================================================
  
    const supabaseClient = window.supabaseClient;
  
    let winRecorded = false;
  
    function getUsername() {
      let username = localStorage.getItem("chgames_username");
  
      if (!username) {
        username = prompt("Enter your CHgames username:");
  
        if (!username) {
          username = "Player";
        }
  
        username = username.trim().slice(0, 20);
  
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
  
    async function recordCheckersWin() {
      if (winRecorded) {
        return;
      }
  
      winRecorded = true;
  
      if (!supabaseClient) {
        console.error("Supabase client was not found.");
        winRecorded = false;
        return;
      }
  
      try {
        const username = getUsername();
  
        const {
          data: existingPlayer,
          error: selectError
        } = await supabaseClient
          .from("player_stats")
          .select("id, username, chess_wins, tictactoe_wins")
          .eq("username", username)
          .maybeSingle();
  
        if (selectError) {
          console.error(
            "Error finding player:",
            selectError
          );
  
          winRecorded = false;
          return;
        }
  
        // Player already exists
        if (existingPlayer) {
          const {
            error: updateError
          } = await supabaseClient
            .from("player_stats")
            .update({
              chess_wins:
                (existingPlayer.chess_wins || 0) + 1
            })
            .eq("id", existingPlayer.id);
  
          if (updateError) {
            console.error(
              "Error updating Checkers wins:",
              updateError
            );
  
            winRecorded = false;
            return;
          }
  
          console.log(
            "Checkers win recorded!"
          );
        }
  
        // Player doesn't exist yet
        else {
          const {
            error: insertError
          } = await supabaseClient
            .from("player_stats")
            .insert({
              username: username,
              chess_wins: 1,
              tictactoe_wins: 0
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
            "Player created and Checkers win recorded!"
          );
        }
  
      } catch (error) {
        console.error(
          "Supabase error:",
          error
        );
  
        winRecorded = false;
      }
    }
  
  
    /*
     * ============================================================
     * CHECKERS
     * ============================================================
     *
     * Rules:
     * - White always goes first.
     * - Player can be black, white, or random.
     * - One piece moves per turn.
     * - If a piece captures and can capture again,
     *   that SAME piece must continue.
     * - Multiple different pieces being able to capture
     *   does NOT force a specific piece.
     * - 0.5 second movement animation.
     *
     * ============================================================
     */
  
    const KING_ROW = {
      black: 7,
      white: 0
    };
  
  
    // ============================================================
    // STATE
    // ============================================================
  
    let board = [];
  
    let playerColor = null;
    let botColor = null;
  
    let difficulty = null;
  
    // WHITE ALWAYS GOES FIRST
    let currentTurn = "white";
  
    let selected = null;
  
    let legalTargets = [];
  
    let forcedContinue = false;
  
    let gameOver = false;
  
    let capturedBlack = 0;
    let capturedWhite = 0;
  
    let colorChoice = null;
    let difficultyChoice = null;
  
    let animationLock = false;
  
  
    // ============================================================
    // DOM
    // ============================================================
  
    const setupScreen =
      document.getElementById("setup-screen");
  
    const gameScreen =
      document.getElementById("game-screen");
  
    const boardEl =
      document.getElementById("board");
  
    const statusEl =
      document.getElementById("status");
  
    const turnLabel =
      document.getElementById("turn-label");
  
    const turnDot =
      document.querySelector(".turn-dot");
  
    const newGameBtn =
      document.getElementById("new-game-btn");
  
    const startBtn =
      document.getElementById("start-btn");
  
    const overlay =
      document.getElementById("game-over-overlay");
  
    const overlayText =
      document.getElementById("game-over-text");
  
    const playAgainBtn =
      document.getElementById("play-again-btn");
  
    const capturedBlackEl =
      document.getElementById("captured-black");
  
    const capturedWhiteEl =
      document.getElementById("captured-white");
  
    const chatPanel =
      document.getElementById("chat-panel");
  
    const chatMessages =
      document.getElementById("chat-messages");
  
    const chatInput =
      document.getElementById("chat-input");
  
    const chatSend =
      document.getElementById("chat-send");
  
  
    // ============================================================
    // SETUP
    // ============================================================
  
    document.querySelectorAll(".color-option").forEach((button) => {
  
      button.addEventListener("click", () => {
  
        document
          .querySelectorAll(".color-option")
          .forEach((b) =>
            b.classList.remove("selected")
          );
  
        button.classList.add("selected");
  
        colorChoice =
          button.dataset.color;
  
        checkStartReady();
      });
  
    });
  
  
    document.querySelectorAll(".difficulty-option").forEach((button) => {
  
      button.addEventListener("click", () => {
  
        document
          .querySelectorAll(".difficulty-option")
          .forEach((b) =>
            b.classList.remove("selected")
          );
  
        button.classList.add("selected");
  
        difficultyChoice =
          button.dataset.difficulty;
  
        checkStartReady();
      });
  
    });
  
  
    function checkStartReady() {
  
      startBtn.disabled =
        !(colorChoice && difficultyChoice);
  
    }
  
  
    startBtn.addEventListener("click", () => {
  
      playerColor =
        colorChoice === "random"
          ? Math.random() < 0.5
            ? "black"
            : "white"
          : colorChoice;
  
      botColor =
        playerColor === "black"
          ? "white"
          : "black";
  
      difficulty =
        difficultyChoice;
  
      startGame();
    });
  
  
    newGameBtn.addEventListener(
      "click",
      backToSetup
    );
  
  
    playAgainBtn.addEventListener(
      "click",
      backToSetup
    );
  
  
    function backToSetup() {
  
      gameScreen.classList.add("hidden");
  
      setupScreen.classList.remove("hidden");
  
      chatPanel.classList.add("hidden");
  
      overlay.classList.add("hidden");
  
      animationLock = false;
  
      clearChat();
    }
  
  
    // ============================================================
    // BOARD HELPERS
    // ============================================================
  
    function inBounds(r, c) {
  
      return (
        r >= 0 &&
        r < 8 &&
        c >= 0 &&
        c < 8
      );
    }
  
  
    function cloneBoard(bd) {
  
      return bd.map((row) =>
        row.map((cell) =>
          cell
            ? { ...cell }
            : null
        )
      );
    }
  
  
    function initBoard() {
  
      const b =
        Array.from(
          { length: 8 },
          () => Array(8).fill(null)
        );
  
  
      // BLACK STARTS AT THE TOP
  
      for (let r = 0; r < 3; r++) {
  
        for (let c = 0; c < 8; c++) {
  
          if ((r + c) % 2 === 1) {
  
            b[r][c] = {
              color: "black",
              king: false
            };
  
          }
  
        }
  
      }
  
  
      // WHITE STARTS AT THE BOTTOM
  
      for (let r = 5; r < 8; r++) {
  
        for (let c = 0; c < 8; c++) {
  
          if ((r + c) % 2 === 1) {
  
            b[r][c] = {
              color: "white",
              king: false
            };
  
          }
  
        }
  
      }
  
  
      return b;
    }
  
  
    function getDirs(piece) {
  
      const forward =
        piece.color === "black"
          ? [
              [1, -1],
              [1, 1]
            ]
          : [
              [-1, -1],
              [-1, 1]
            ];
  
  
      if (piece.king) {
  
        return [
          [1, -1],
          [1, 1],
          [-1, -1],
          [-1, 1]
        ];
  
      }
  
  
      return forward;
    }
  
  
    function generateSimpleMovesFrom(
      bd,
      r,
      c,
      piece
    ) {
  
      const result = [];
  
      for (const [dr, dc] of getDirs(piece)) {
  
        const nr = r + dr;
        const nc = c + dc;
  
        if (
          inBounds(nr, nc) &&
          !bd[nr][nc]
        ) {
  
          result.push({
            r: nr,
            c: nc
          });
  
        }
  
      }
  
      return result;
    }
  
  
    function generateJumpsFrom(
      bd,
      r,
      c,
      piece
    ) {
  
      const result = [];
  
      for (const [dr, dc] of getDirs(piece)) {
  
        const mr = r + dr;
        const mc = c + dc;
  
        const lr = r + 2 * dr;
        const lc = c + 2 * dc;
  
        if (!inBounds(lr, lc)) {
          continue;
        }
  
        const middle =
          bd[mr][mc];
  
        if (
          middle &&
          middle.color !== piece.color &&
          !bd[lr][lc]
        ) {
  
          result.push({
            mid: {
              r: mr,
              c: mc
            },
  
            landing: {
              r: lr,
              c: lc
            }
          });
  
        }
  
      }
  
      return result;
    }
  
  
    function hasAnyCapture(
      bd,
      color
    ) {
  
      for (let r = 0; r < 8; r++) {
  
        for (let c = 0; c < 8; c++) {
  
          const piece =
            bd[r][c];
  
          if (
            piece &&
            piece.color === color &&
            generateJumpsFrom(
              bd,
              r,
              c,
              piece
            ).length > 0
          ) {
  
            return true;
          }
  
        }
  
      }
  
      return false;
    }
  
  
    function countPieces(
      bd,
      color
    ) {
  
      let count = 0;
  
      for (let r = 0; r < 8; r++) {
  
        for (let c = 0; c < 8; c++) {
  
          if (
            bd[r][c] &&
            bd[r][c].color === color
          ) {
  
            count++;
          }
  
        }
  
      }
  
      return count;
    }
  
  
    // ============================================================
    // BOT MOVE GENERATION
    // ============================================================
  
    function dfsJumps(
      bd,
      r,
      c,
      piece,
      path,
      results
    ) {
  
      const jumps =
        generateJumpsFrom(
          bd,
          r,
          c,
          piece
        );
  
  
      if (jumps.length === 0) {
  
        if (path.length > 0) {
  
          results.push({
            path: path.slice(),
            board: bd
          });
  
        }
  
        return;
      }
  
  
      for (const jump of jumps) {
  
        const nb =
          cloneBoard(bd);
  
        nb[r][c] = null;
  
        nb[
          jump.mid.r
        ][
          jump.mid.c
        ] = null;
  
  
        const promoted =
          !piece.king &&
          jump.landing.r ===
            KING_ROW[piece.color];
  
  
        const newPiece = {
          color: piece.color,
          king:
            piece.king || promoted
        };
  
  
        nb[
          jump.landing.r
        ][
          jump.landing.c
        ] = newPiece;
  
  
        const newPath =
          path.concat([
            {
              from: { r, c },
  
              to: jump.landing,
  
              captured: jump.mid,
  
              promoted
            }
          ]);
  
  
        // Once a normal piece becomes king,
        // its jump sequence ends for this turn.
  
        if (promoted) {
  
          results.push({
            path: newPath,
            board: nb
          });
  
        } else {
  
          dfsJumps(
            nb,
            jump.landing.r,
            jump.landing.c,
            newPiece,
            newPath,
            results
          );
  
        }
  
      }
  
    }
  
  
    function generateFullTurns(
      bd,
      color
    ) {
  
      const sequences = [];
  
  
      // FIRST LOOK FOR CAPTURES
  
      for (let r = 0; r < 8; r++) {
  
        for (let c = 0; c < 8; c++) {
  
          const piece =
            bd[r][c];
  
          if (
            piece &&
            piece.color === color
          ) {
  
            dfsJumps(
              bd,
              r,
              c,
              piece,
              [],
              sequences
            );
  
          }
  
        }
  
      }
  
  
      if (sequences.length > 0) {
  
        return sequences;
      }
  
  
      // OTHERWISE SIMPLE MOVES
  
      const simples = [];
  
  
      for (let r = 0; r < 8; r++) {
  
        for (let c = 0; c < 8; c++) {
  
          const piece =
            bd[r][c];
  
          if (
            !piece ||
            piece.color !== color
          ) {
  
            continue;
          }
  
  
          for (
            const move of
            generateSimpleMovesFrom(
              bd,
              r,
              c,
              piece
            )
          ) {
  
            const nb =
              cloneBoard(bd);
  
            nb[r][c] = null;
  
  
            const promoted =
              !piece.king &&
              move.r ===
                KING_ROW[piece.color];
  
  
            nb[move.r][move.c] = {
              color: piece.color,
  
              king:
                piece.king ||
                promoted
            };
  
  
            simples.push({
              path: [
                {
                  from: { r, c },
  
                  to: move,
  
                  captured: null,
  
                  promoted
                }
              ],
  
              board: nb
            });
  
          }
  
        }
  
      }
  
  
      return simples;
    }
  
  
    // ============================================================
    // BOT AI
    // ============================================================
  
    function evaluate(
      bd,
      color
    ) {
  
      let score = 0;
  
  
      for (let r = 0; r < 8; r++) {
  
        for (let c = 0; c < 8; c++) {
  
          const piece =
            bd[r][c];
  
          if (!piece) {
            continue;
          }
  
  
          let value =
            piece.king
              ? 130
              : 100;
  
  
          if (!piece.king) {
  
            value +=
              (
                piece.color === "black"
                  ? r
                  : 7 - r
              ) * 3;
  
          }
  
  
          if (
            c >= 2 &&
            c <= 5
          ) {
  
            value += 4;
  
          }
  
  
          const backRow =
            piece.color === "black"
              ? 0
              : 7;
  
  
          if (
            !piece.king &&
            r === backRow
          ) {
  
            value += 5;
  
          }
  
  
          score +=
            piece.color === color
              ? value
              : -value;
  
        }
  
      }
  
  
      return score;
    }
  
  
    function minimax(
      bd,
      depth,
      alpha,
      beta,
      maximizing,
      maxColor,
      minColor
    ) {
  
      const color =
        maximizing
          ? maxColor
          : minColor;
  
  
      const moves =
        generateFullTurns(
          bd,
          color
        );
  
  
      if (moves.length === 0) {
  
        return maximizing
          ? -100000
          : 100000;
      }
  
  
      if (depth === 0) {
  
        return evaluate(
          bd,
          maxColor
        );
      }
  
  
      if (maximizing) {
  
        let value = -Infinity;
  
  
        for (const move of moves) {
  
          value =
            Math.max(
              value,
  
              minimax(
                move.board,
                depth - 1,
                alpha,
                beta,
                false,
                maxColor,
                minColor
              )
            );
  
  
          alpha =
            Math.max(
              alpha,
              value
            );
  
  
          if (beta <= alpha) {
            break;
          }
  
        }
  
  
        return value;
  
      } else {
  
        let value = Infinity;
  
  
        for (const move of moves) {
  
          value =
            Math.min(
              value,
  
              minimax(
                move.board,
                depth - 1,
                alpha,
                beta,
                true,
                maxColor,
                minColor
              )
            );
  
  
          beta =
            Math.min(
              beta,
              value
            );
  
  
          if (beta <= alpha) {
            break;
          }
  
        }
  
  
        return value;
      }
  
    }
  
  
    function chooseBotMove() {
  
      const moves =
        generateFullTurns(
          board,
          botColor
        );
  
  
      if (moves.length === 0) {
        return null;
      }
  
  
      // EASY
  
      if (difficulty === "easy") {
  
        return moves[
          Math.floor(
            Math.random() *
            moves.length
          )
        ];
  
      }
  
  
      // MEDIUM / HARD
  
      const depth =
        difficulty === "medium"
          ? 2
          : 4;
  
  
      let best =
        -Infinity;
  
      let bestMoves = [];
  
  
      for (const move of moves) {
  
        const value =
          minimax(
            move.board,
            depth - 1,
            -Infinity,
            Infinity,
            false,
            botColor,
            playerColor
          );
  
  
        if (value > best) {
  
          best = value;
  
          bestMoves = [move];
  
        } else if (
          value === best
        ) {
  
          bestMoves.push(move);
  
        }
  
      }
  
  
      return bestMoves[
        Math.floor(
          Math.random() *
          bestMoves.length
        )
      ];
    }
  
  
    // ============================================================
    // BOT MOVE
    // ============================================================
  
    function botMove() {
  
      if (gameOver) {
        return;
      }
  
  
      if (
        currentTurn !== botColor
      ) {
  
        return;
      }
  
  
      const chosen =
        chooseBotMove();
  
  
      if (!chosen) {
  
        endTurn();
  
        return;
      }
  
  
      const captureCount =
        chosen.path.filter(
          step => step.captured
        ).length;
  
  
      const wasPromotion =
        chosen.path.some(
          step => step.promoted
        );
  
  
      // Update capture counters
  
      for (
        const step of chosen.path
      ) {
  
        if (!step.captured) {
          continue;
        }
  
  
        const capturedPiece =
          board[
            step.captured.r
          ][
            step.captured.c
          ];
  
  
        if (
          capturedPiece?.color === "black"
        ) {
  
          capturedBlack++;
  
        } else if (
          capturedPiece?.color === "white"
        ) {
  
          capturedWhite++;
  
        }
  
      }
  
  
      animateBotTurn(
        chosen,
        captureCount,
        wasPromotion
      );
  
    }
  
  
    async function animateBotTurn(
      chosen,
      captureCount,
      wasPromotion
    ) {
  
      animationLock = true;
  
  
      for (
        const step of chosen.path
      ) {
  
        const piece =
          board[
            step.from.r
          ][
            step.from.c
          ];
  
  
        if (!piece) {
          continue;
        }
  
  
        board[
          step.from.r
        ][
          step.from.c
        ] = null;
  
  
        if (step.captured) {
  
          board[
            step.captured.r
          ][
            step.captured.c
          ] = null;
  
        }
  
  
        const promoted =
          !piece.king &&
          step.to.r ===
            KING_ROW[piece.color];
  
  
        board[
          step.to.r
        ][
          step.to.c
        ] = {
          color: piece.color,
  
          king:
            piece.king ||
            promoted
        };
  
  
        renderBoard(
          step.to
        );
  
  
        await wait(500);
  
      }
  
  
      animationLock = false;
  
  
      renderCaptured();
  
  
      if (captureCount > 0) {
  
        taphReact(
          captureCount >= 2
            ? "doubleCapture"
            : "botCapture"
        );
  
      }
  
  
      if (wasPromotion) {
  
        taphReact("botKing");
  
      }
  
  
      endTurn();
  
    }
  
  
    // ============================================================
    // PLAYER INTERACTION
    // ============================================================
  
    function onSquareClick(
      r,
      c
    ) {
  
      if (
        gameOver ||
        animationLock ||
        currentTurn !== playerColor
      ) {
  
        return;
      }
  
  
      const target =
        legalTargets.find(
          target =>
            target.r === r &&
            target.c === c
        );
  
  
      if (
        selected &&
        target
      ) {
  
        applyPlayerStep(
          selected.r,
          selected.c,
          target
        );
  
        return;
      }
  
  
      if (forcedContinue) {
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
  
  
      const mustCapture =
        hasAnyCapture(
          board,
          playerColor
        );
  
  
      const jumps =
        generateJumpsFrom(
          board,
          r,
          c,
          piece
        );
  
  
      const simples =
        generateSimpleMovesFrom(
          board,
          r,
          c,
          piece
        );
  
  
      let moves;
  
  
      if (mustCapture) {
  
        if (jumps.length === 0) {
  
          clearSelection();
  
          return;
        }
  
  
        moves =
          jumps.map(
            jump => ({
              r: jump.landing.r,
              c: jump.landing.c,
  
              isJump: true,
  
              capR: jump.mid.r,
              capC: jump.mid.c
            })
          );
  
      } else {
  
        if (simples.length === 0) {
  
          clearSelection();
  
          return;
        }
  
  
        moves =
          simples.map(
            move => ({
              r: move.r,
              c: move.c,
  
              isJump: false
            })
          );
  
      }
  
  
      selected = {
        r,
        c
      };
  
  
      legalTargets = moves;
  
  
      renderBoard();
  
    }
  
  
    function clearSelection() {
  
      selected = null;
  
      legalTargets = [];
  
      renderBoard();
    }
  
  
    async function applyPlayerStep(
      fr,
      fc,
      target
    ) {
  
      if (animationLock) {
        return;
      }
  
  
      animationLock = true;
  
  
      const piece =
        board[fr][fc];
  
  
      if (!piece) {
  
        animationLock = false;
  
        return;
      }
  
  
      board[fr][fc] = null;
  
  
      let capturedPiece = null;
  
  
      if (target.isJump) {
  
        capturedPiece =
          board[
            target.capR
          ][
            target.capC
          ];
  
  
        if (capturedPiece) {
  
          if (
            capturedPiece.color === "black"
          ) {
  
            capturedBlack++;
  
          } else {
  
            capturedWhite++;
  
          }
  
        }
  
  
        board[
          target.capR
        ][
          target.capC
        ] = null;
  
      }
  
  
      const promoted =
        !piece.king &&
        target.r ===
          KING_ROW[piece.color];
  
  
      board[
        target.r
      ][
        target.c
      ] = {
  
        color: piece.color,
  
        king:
          piece.king ||
          promoted
      };
  
  
      selected = null;
  
      legalTargets = [];
  
  
      renderBoard(
        target
      );
  
  
      await wait(500);
  
  
      renderCaptured();
  
  
      if (target.isJump) {
  
        taphReact("playerCapture");
  
      }
  
  
      if (promoted) {
  
        taphReact("playerKing");
  
      }
  
  
      if (
        target.isJump &&
        !promoted
      ) {
  
        const currentPiece =
          board[
            target.r
          ][
            target.c
          ];
  
  
        const moreJumps =
          generateJumpsFrom(
            board,
            target.r,
            target.c,
            currentPiece
          );
  
  
        if (moreJumps.length > 0) {
  
          selected = {
            r: target.r,
            c: target.c
          };
  
  
          legalTargets =
            moreJumps.map(
              jump => ({
                r: jump.landing.r,
                c: jump.landing.c,
  
                isJump: true,
  
                capR: jump.mid.r,
                capC: jump.mid.c
              })
            );
  
  
          forcedContinue = true;
  
          animationLock = false;
  
          renderBoard();
  
          taphReact("continueCapture");
  
          return;
        }
  
      }
  
  
      forcedContinue = false;
  
      animationLock = false;
  
  
      endTurn();
  
    }
  
  
    // ============================================================
    // TURN FLOW
    // ============================================================
  
    function endTurn() {
  
      currentTurn =
        currentTurn === "black"
          ? "white"
          : "black";
  
  
      selected = null;
  
      legalTargets = [];
  
      forcedContinue = false;
  
  
      renderBoard();
  
      renderCaptured();
  
  
      const winner =
        checkGameOver();
  
  
      if (winner) {
  
        showGameOver(winner);
  
        return;
      }
  
  
      updateStatus();
  
  
      if (
        currentTurn === botColor
      ) {
  
        taphReact("botThinking");
  
  
        setTimeout(
          botMove,
          650
        );
  
      } else {
  
        taphReact("yourTurn");
  
      }
  
    }
  
  
    function checkGameOver() {
  
      if (
        countPieces(
          board,
          "black"
        ) === 0
      ) {
  
        return "white";
      }
  
  
      if (
        countPieces(
          board,
          "white"
        ) === 0
      ) {
  
        return "black";
      }
  
  
      if (
        generateFullTurns(
          board,
          currentTurn
        ).length === 0
      ) {
  
        return currentTurn === "black"
          ? "white"
          : "black";
  
      }
  
  
      return null;
    }
  
  
    // ============================================================
    // GAME OVER
    // ============================================================
  
    function showGameOver(
      winnerColor
    ) {
  
      gameOver = true;
  
  
      const youWon =
        winnerColor === playerColor;
  
  
      overlayText.textContent =
        youWon
          ? "You win!"
          : "The bot wins";
  
  
      overlay.classList.remove(
        "hidden"
      );
  
  
      // Record Checkers win in Supabase
      if (youWon) {
  
        taphReact("win");
  
        recordCheckersWin();
  
      } else {
  
        taphReact("lose");
  
      }
  
  
      updateStatus();
  
    }
  
  
    // ============================================================
    // RENDERING
    // ============================================================
  
    function renderBoard(
      movingTo = null
    ) {
  
      boardEl.innerHTML = "";
  
  
      const flipped =
        playerColor === "black";
  
  
      for (let r = 0; r < 8; r++) {
  
        for (let c = 0; c < 8; c++) {
  
          const square =
            document.createElement("div");
  
  
          const dark =
            (r + c) % 2 === 1;
  
  
          square.className =
            "square " +
            (
              dark
                ? "dark"
                : "light"
            );
  
  
          const displayR =
            flipped
              ? 7 - r
              : r;
  
  
          const displayC =
            flipped
              ? 7 - c
              : c;
  
  
          square.style.gridRowStart =
            displayR + 1;
  
  
          square.style.gridColumnStart =
            displayC + 1;
  
  
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
            legalTargets.some(
              target =>
                target.r === r &&
                target.c === c
            )
          ) {
  
            square.classList.add(
              "legal-target"
            );
  
          }
  
  
          const piece =
            board[r][c];
  
  
          if (piece) {
  
            const pieceEl =
              document.createElement("div");
  
  
            pieceEl.className =
              "piece " +
              piece.color +
              (
                piece.king
                  ? " king"
                  : ""
              );
  
  
            if (
              movingTo &&
              movingTo.r === r &&
              movingTo.c === c
            ) {
  
              pieceEl.classList.add(
                "moving"
              );
  
            }
  
  
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
  
  
    function renderCaptured() {
  
      capturedBlackEl.innerHTML = "";
  
  
      for (
        let i = 0;
        i < capturedBlack;
        i++
      ) {
  
        const dot =
          document.createElement("div");
  
        dot.className =
          "captured-piece-dot black";
  
        capturedBlackEl.appendChild(
          dot
        );
  
      }
  
  
      capturedWhiteEl.innerHTML = "";
  
  
      for (
        let i = 0;
        i < capturedWhite;
        i++
      ) {
  
        const dot =
          document.createElement("div");
  
        dot.className =
          "captured-piece-dot white";
  
        capturedWhiteEl.appendChild(
          dot
        );
  
      }
  
    }
  
  
    function updateStatus() {
  
      const isPlayerTurn =
        currentTurn === playerColor;
  
  
      turnLabel.textContent =
        (
          currentTurn === "black"
            ? "Black"
            : "White"
        ) +
        " to move";
  
  
      turnDot.classList.toggle(
        "white",
        currentTurn === "white"
      );
  
  
      if (gameOver) {
  
        statusEl.textContent =
          "Game over";
  
      } else if (forcedContinue) {
  
        statusEl.textContent =
          "Continue the jump";
  
      } else if (isPlayerTurn) {
  
        statusEl.textContent =
          "Your move";
  
      } else {
  
        statusEl.textContent =
          "Bot is thinking…";
  
      }
  
    }
  
  
    // ============================================================
    // GAME START
    // ============================================================
  
    function startGame() {
  
      board =
        initBoard();
  
      currentTurn =
        "white";
  
      selected = null;
  
      legalTargets = [];
  
      forcedContinue = false;
  
      gameOver = false;
  
      animationLock = false;
  
      winRecorded = false;
  
      capturedBlack = 0;
  
      capturedWhite = 0;
  
  
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
  
  
      clearChat();
  
      renderBoard();
  
      renderCaptured();
  
      updateStatus();
  
  
      addTaphMessage(
        "👀"
      );
  
  
      setTimeout(
        () => {
  
          if (
            currentTurn === playerColor
          ) {
  
            addTaphMessage(
              "👍"
            );
  
          } else {
  
            addTaphMessage(
              "😈"
            );
  
          }
  
        },
        500
      );
  
  
      if (
        currentTurn === botColor
      ) {
  
        setTimeout(
          botMove,
          650
        );
  
      }
  
    }
  
  
    // ============================================================
    // CHAT
    // ============================================================
  
    function clearChat() {
  
      chatMessages.innerHTML = "";
  
    }
  
  
    function addTaphMessage(
      text
    ) {
  
      const wrapper =
        document.createElement("div");
  
      wrapper.className =
        "chat-message taph-message";
  
  
      const avatar =
        document.createElement("div");
  
      avatar.className =
        "message-avatar";
  
      avatar.textContent =
        "T";
  
  
      const bubble =
        document.createElement("div");
  
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
        document.createElement("div");
  
      wrapper.className =
        "chat-message player-message";
  
  
      const bubble =
        document.createElement("div");
  
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
        document.createElement("div");
  
      wrapper.className =
        "chat-message taph-message";
  
  
      const avatar =
        document.createElement("div");
  
      avatar.className =
        "message-avatar";
  
      avatar.textContent =
        "T";
  
  
      const bubble =
        document.createElement("div");
  
      bubble.className =
        "message-bubble typing-bubble";
  
  
      for (
        let i = 0;
        i < 3;
        i++
      ) {
  
        const dot =
          document.createElement("span");
  
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
          "😳"
        ],
  
        botCapture: [
          "😰",
          "💀",
          "👀"
        ],
  
        doubleCapture: [
          "💥💥",
          "😳",
          "🔥"
        ],
  
        continueCapture: [
          "👀",
          "👉",
          "💥"
        ],
  
        playerKing: [
          "👑",
          "😳✨",
          "🔥👑"
        ],
  
        botKing: [
          "😰",
          "👀",
          "👑"
        ],
  
        botThinking: [
          "👀",
          "🤔",
          "..."
        ],
  
        yourTurn: [
          "👀",
          "👍"
        ],
  
        win: [
          "🎉",
          "👑",
          "🙏✨"
        ],
  
        lose: [
          "😰",
          "💀",
          "😭"
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
  
  
    // ============================================================
    // PLAYER CHAT INPUT
    // ============================================================
  
    function sendChat() {
  
      const text =
        chatInput.value.trim();
  
  
      if (!text) {
        return;
      }
  
  
      addPlayerMessage(
        text
      );
  
  
      chatInput.value = "";
  
  
      setTimeout(
        () => {
  
          const lower =
            text.toLowerCase();
  
  
          if (
            lower.includes("hi") ||
            lower.includes("hello") ||
            lower.includes("hey")
          ) {
  
            taphReact("yourTurn");
  
          } else if (
            lower.includes("help")
          ) {
  
            taphReact("yourTurn");
  
          } else if (
            lower.includes("gg") ||
            lower.includes("good game")
          ) {
  
            taphReact("win");
  
          } else {
  
            const random =
              [
                "👀",
                "👍",
                "🤨",
                "😐",
                "🎃",
                "..."
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
  
          }
  
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
  
  
    // ============================================================
    // UTILITY
    // ============================================================
  
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