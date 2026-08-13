(function () {

    "use strict";
  
  
    /* =========================================================
       SUPABASE
    ========================================================= */
  
    const SUPABASE_URL =
      "https://ijtclttmxnckpieqkaki.supabase.co";
  
    const SUPABASE_KEY =
      "sb_publishable_ntobIYEBKNJI3tPpfD_izQ_xLJ-n7UL";
  
    let supabaseClient = null;
    let supabaseReady = false;
  
  
    import(
      "https://esm.sh/@supabase/supabase-js@2"
    )
      .then(({ createClient }) => {
  
        supabaseClient =
          createClient(
            SUPABASE_URL,
            SUPABASE_KEY
          );
  
        supabaseReady = true;
  
        console.log(
          "Dots & Boxes Supabase connection ready."
        );
  
      })
      .catch((error) => {
  
        console.error(
          "Could not load Supabase:",
          error
        );
  
      });
  
  
    /* =========================================================
       SHARED USERNAME
    ========================================================= */
  
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
  
  
    /* =========================================================
       STATE
    ========================================================= */
  
    const GRID_SIZE = 6;
  
    const BOX_SIZE =
      GRID_SIZE - 1;
  
    let horizontalLines = [];
  
    let verticalLines = [];
  
    let boxes = [];
  
    let currentPlayer = "player";
  
    let playerColor = "blue";
  
    let botColor = "red";
  
    let difficulty = null;
  
    let playerScore = 0;
  
    let botScore = 0;
  
    let gameOver = false;
  
    let animationLock = false;
  
    let dotsBoxesWinSaved = false;
  
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
        "dots-board"
      );
  
    const statusEl =
      document.getElementById(
        "status"
      );
  
    const playerScoreEl =
      document.getElementById(
        "player-score"
      );
  
    const botScoreEl =
      document.getElementById(
        "bot-score"
      );
  
    const startBtn =
      document.getElementById(
        "start-btn"
      );
  
    const playerScorePanel =
      document.getElementById(
        "player-score-panel"
      );
  
    const botScorePanel =
      document.getElementById(
        "bot-score-panel"
      );
  
    const newGameBtn =
      document.getElementById(
        "new-game-btn"
      );
  
    const playAgainBtn =
      document.getElementById(
        "play-again-btn"
      );
  
    const overlay =
      document.getElementById(
        "game-over-overlay"
      );
  
    const overlayText =
      document.getElementById(
        "game-over-text"
      );
  
    const overlayScore =
      document.getElementById(
        "game-over-score"
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
       GET COLOR CLASS
    ========================================================= */
  
    function getColorClass(owner) {
  
      if (owner === "player") {
        return playerColor;
      }
  
      if (owner === "bot") {
        return botColor;
      }
  
      return null;
  
    }
  
  
    /* =========================================================
       DOTS & BOXES WIN REWARD
    ========================================================= */
  
    function getDotsBoxesWinReward() {
  
      if (difficulty === "hard") {
        return 3;
      }
  
      if (difficulty === "medium") {
        return 2;
      }
  
      return 1;
  
    }
  
  
    /* =========================================================
       UPDATE SCORE COLORS
    ========================================================= */
  
    function updateScoreColors() {
  
      playerScorePanel.classList.remove(
        "blue-score",
        "red-score"
      );
  
      botScorePanel.classList.remove(
        "blue-score",
        "red-score"
      );
  
      playerScorePanel.classList.add(
        `${playerColor}-score`
      );
  
      botScorePanel.classList.add(
        `${botColor}-score`
      );
  
    }
  
  
    /* =========================================================
       SAVE WIN
    ========================================================= */
  
    async function saveDotsBoxesWin() {
  
      if (dotsBoxesWinSaved) {
        return;
      }
  
      dotsBoxesWinSaved = true;
  
      const username =
        getUsername();
  
      const reward =
        getDotsBoxesWinReward();
  
  
      let attempts = 0;
  
      while (
        !supabaseReady &&
        attempts < 50
      ) {
  
        await wait(100);
  
        attempts++;
  
      }
  
  
      if (
        !supabaseReady ||
        !supabaseClient
      ) {
  
        console.error(
          "Supabase is not ready."
        );
  
        dotsBoxesWinSaved = false;
  
        return;
  
      }
  
  
      try {
  
        const {
          data: existingPlayer,
          error: selectError
        } =
          await supabaseClient
            .from("player_stats")
            .select(
              "id, username, checkers_wins, tictactoe_wins, chess_wins, dots_boxes_wins, total_wins"
            )
            .eq(
              "username",
              username
            )
            .maybeSingle();
  
  
        if (selectError) {
  
          console.error(
            "ERROR FINDING PLAYER:",
            selectError
          );
  
          dotsBoxesWinSaved = false;
  
          return;
  
        }
  
  
        /* =========================================
           CREATE PLAYER
        ========================================= */
  
        if (!existingPlayer) {
  
          const {
            data,
            error
          } =
            await supabaseClient
              .from("player_stats")
              .insert({
  
                username: username,
  
                checkers_wins: 0,
  
                tictactoe_wins: 0,
  
                chess_wins: 0,
  
                dots_boxes_wins: reward,
  
                total_wins: reward
  
              })
              .select()
              .single();
  
  
          if (error) {
  
            console.error(
              "ERROR CREATING PLAYER:",
              error
            );
  
            dotsBoxesWinSaved = false;
  
            return;
  
          }
  
  
          console.log(
            "Dots & Boxes player created:",
            data
          );
  
          return;
  
        }
  
  
        /* =========================================
           EXISTING PLAYER
        ========================================= */
  
        const currentDotsBoxesWins =
          Number(
            existingPlayer.dots_boxes_wins || 0
          );
  
        
  
  
        const {
          data,
          error
        } =
          await supabaseClient
            .from("player_stats")
            .update({
  
              dots_boxes_wins:
                currentDotsBoxesWins + reward,
  
              
  
            })
            .eq(
              "id",
              existingPlayer.id
            )
            .select()
            .single();
  
  
        if (error) {
  
          console.error(
            "ERROR UPDATING PLAYER:",
            error
          );
  
          dotsBoxesWinSaved = false;
  
          return;
  
        }
  
  
        console.log(
          "Dots & Boxes win saved:",
          data
        );
  
      } catch (error) {
  
        console.error(
          "UNEXPECTED DOTS & BOXES SAVE ERROR:",
          error
        );
  
        dotsBoxesWinSaved = false;
  
      }
  
    }
  
  
    /* =========================================================
       SETUP
    ========================================================= */
  
    document
      .querySelectorAll(".color-option")
      .forEach((button) => {
  
        button.addEventListener(
          "click",
          () => {
  
            document
              .querySelectorAll(
                ".color-option"
              )
              .forEach((b) => {
  
                b.classList.remove(
                  "selected"
                );
  
              });
  
  
            button.classList.add(
              "selected"
            );
  
  
            colorChoice =
              button.dataset.color;
  
  
            checkStartReady();
  
          }
        );
  
      });
  
  
    document
      .querySelectorAll(
        ".difficulty-option"
      )
      .forEach((button) => {
  
        button.addEventListener(
          "click",
          () => {
  
            document
              .querySelectorAll(
                ".difficulty-option"
              )
              .forEach((b) => {
  
                b.classList.remove(
                  "selected"
                );
  
              });
  
  
            button.classList.add(
              "selected"
            );
  
  
            difficultyChoice =
              button.dataset.difficulty;
  
  
            checkStartReady();
  
          }
        );
  
      });
  
  
    function checkStartReady() {
  
      startBtn.disabled =
        !(
          colorChoice &&
          difficultyChoice
        );
  
    }
  
  
    /* =========================================================
       START BUTTON
    ========================================================= */
  
    startBtn.addEventListener(
      "click",
      () => {
  
        /*
         * Choose the player's color.
         *
         * Blue = player goes first.
         * Red = bot goes first.
         */
  
        if (
          colorChoice === "random"
        ) {
  
          playerColor =
            Math.random() < 0.5
              ? "blue"
              : "red";
  
        } else {
  
          playerColor =
            colorChoice;
  
        }
  
  
        /*
         * Bot gets the opposite color.
         */
  
        botColor =
          playerColor === "blue"
            ? "red"
            : "blue";
  
  
        difficulty =
          difficultyChoice;
  
  
        updateScoreColors();
  
  
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
  
      animationLock = false;
  
      clearChat();
  
    }
  
  
    /* =========================================================
       BOARD SETUP
    ========================================================= */
  
    function createGameBoard() {
  
      horizontalLines =
        Array.from(
          { length: GRID_SIZE },
          () =>
            Array(
              GRID_SIZE - 1
            ).fill(null)
        );
  
  
      verticalLines =
        Array.from(
          { length: GRID_SIZE - 1 },
          () =>
            Array(
              GRID_SIZE
            ).fill(null)
        );
  
  
      boxes =
        Array.from(
          { length: BOX_SIZE },
          () =>
            Array(
              BOX_SIZE
            ).fill(null)
        );
  
    }
  
  
    /* =========================================================
       DRAW BOARD
    ========================================================= */
  
    function renderBoard() {
  
      boardEl.innerHTML = "";
  
  
      const boardWidth =
        boardEl.clientWidth;
  
      const boardHeight =
        boardEl.clientHeight;
  
  
      if (
        boardWidth === 0 ||
        boardHeight === 0
      ) {
  
        return;
  
      }
  
  
      const spacing =
        100 / (GRID_SIZE - 1);
  
  
      /* =========================================
         BOXES
      ========================================= */
  
      for (
        let r = 0;
        r < BOX_SIZE;
        r++
      ) {
  
        for (
          let c = 0;
          c < BOX_SIZE;
          c++
        ) {
  
          if (!boxes[r][c]) {
            continue;
          }
  
  
          const box =
            document.createElement(
              "div"
            );
  
  
          const color =
            getColorClass(
              boxes[r][c]
            );
  
  
          box.className =
            `box ${color}-box`;
  
  
          box.textContent =
            boxes[r][c] === "player"
              ? "✓"
              : "×";
  
  
          box.style.left =
            `${c * spacing}%`;
  
          box.style.top =
            `${r * spacing}%`;
  
          box.style.width =
            `${spacing}%`;
  
          box.style.height =
            `${spacing}%`;
  
  
          boardEl.appendChild(
            box
          );
  
        }
  
      }
  
  
      /* =========================================
         HORIZONTAL LINES
      ========================================= */
  
      for (
        let r = 0;
        r < GRID_SIZE;
        r++
      ) {
  
        for (
          let c = 0;
          c < GRID_SIZE - 1;
          c++
        ) {
  
          const button =
            document.createElement(
              "button"
            );
  
  
          button.type = "button";
  
          button.className =
            "line horizontal";
  
  
          if (
            horizontalLines[r][c]
          ) {
  
            const color =
              getColorClass(
                horizontalLines[r][c]
              );
  
  
            button.classList.add(
              `${color}-line`
            );
  
            button.classList.add(
              "taken"
            );
  
          }
  
  
          button.style.left =
            `${c * spacing}%`;
  
          button.style.top =
            `${r * spacing}%`;
  
          button.style.width =
            `${spacing}%`;
  
  
          if (
            !horizontalLines[r][c] &&
            currentPlayer === "player" &&
            !gameOver &&
            !animationLock
          ) {
  
            button.addEventListener(
              "click",
              () =>
                makeMove(
                  "horizontal",
                  r,
                  c
                )
            );
  
          }
  
  
          boardEl.appendChild(
            button
          );
  
        }
  
      }
  
  
      /* =========================================
         VERTICAL LINES
      ========================================= */
  
      for (
        let r = 0;
        r < GRID_SIZE - 1;
        r++
      ) {
  
        for (
          let c = 0;
          c < GRID_SIZE;
          c++
        ) {
  
          const button =
            document.createElement(
              "button"
            );
  
  
          button.type = "button";
  
          button.className =
            "line vertical";
  
  
          if (
            verticalLines[r][c]
          ) {
  
            const color =
              getColorClass(
                verticalLines[r][c]
              );
  
  
            button.classList.add(
              `${color}-line`
            );
  
            button.classList.add(
              "taken"
            );
  
          }
  
  
          button.style.left =
            `${c * spacing}%`;
  
          button.style.top =
            `${r * spacing}%`;
  
          button.style.height =
            `${spacing}%`;
  
  
          if (
            !verticalLines[r][c] &&
            currentPlayer === "player" &&
            !gameOver &&
            !animationLock
          ) {
  
            button.addEventListener(
              "click",
              () =>
                makeMove(
                  "vertical",
                  r,
                  c
                )
            );
  
          }
  
  
          boardEl.appendChild(
            button
          );
  
        }
  
      }
  
  
      /* =========================================
         DOTS
      ========================================= */
  
      for (
        let r = 0;
        r < GRID_SIZE;
        r++
      ) {
  
        for (
          let c = 0;
          c < GRID_SIZE;
          c++
        ) {
  
          const dot =
            document.createElement(
              "div"
            );
  
  
          dot.className =
            "dot";
  
  
          dot.style.left =
            `${c * spacing}%`;
  
          dot.style.top =
            `${r * spacing}%`;
  
  
          boardEl.appendChild(
            dot
          );
  
        }
  
      }
  
    }
  
  
    /* =========================================================
       PLAYER MOVE
    ========================================================= */
  
    function makeMove(
      direction,
      r,
      c
    ) {
  
      if (
        gameOver ||
        animationLock ||
        currentPlayer !== "player"
      ) {
  
        return;
  
      }
  
  
      if (
        direction === "horizontal"
      ) {
  
        if (
          horizontalLines[r][c]
        ) {
  
          return;
  
        }
  
  
        horizontalLines[r][c] =
          "player";
  
      } else {
  
        if (
          verticalLines[r][c]
        ) {
  
          return;
  
        }
  
  
        verticalLines[r][c] =
          "player";
  
      }
  
  
      processMove(
        direction,
        r,
        c,
        "player"
      );
  
    }
  
  
    /* =========================================================
       PROCESS MOVE
    ========================================================= */
  
    function processMove(
      direction,
      r,
      c,
      owner
    ) {
  
      const completed =
        findCompletedBoxes(
          direction,
          r,
          c
        );
  
  
      if (
        completed.length > 0
      ) {
  
        completed.forEach(
          ([boxR, boxC]) => {
  
            boxes[boxR][boxC] =
              owner;
  
  
            if (
              owner === "player"
            ) {
  
              playerScore++;
  
            } else {
  
              botScore++;
  
            }
  
          }
        );
  
  
        taphReact(
          owner === "player"
            ? "box"
            : "botBox"
        );
  
  
        updateScores();
  
        renderBoard();
  
  
        if (
          checkGameOver()
        ) {
  
          return;
  
        }
  
  
        /*
         * Completing a box means
         * the same player gets another turn.
         */
  
        if (
          owner === "player"
        ) {
  
          currentPlayer =
            "player";
  
          animationLock = false;
  
          updateStatus();
  
          renderBoard();
  
          return;
  
        }
  
  
        /*
         * Bot completed a box.
         * Bot gets another turn.
         */
  
        if (
          owner === "bot"
        ) {
  
          currentPlayer =
            "bot";
  
          animationLock = true;
  
          updateStatus();
  
          setTimeout(
            botMove,
            400
          );
  
          return;
  
        }
  
      }
  
  
      /*
       * No box was completed.
       * Switch players.
       */
  
      switchTurn();
  
    }
  
  
    /* =========================================================
       FIND COMPLETED BOXES
    ========================================================= */
  
    function findCompletedBoxes(
      direction,
      r,
      c
    ) {
  
      const completed = [];
  
  
      if (
        direction === "horizontal"
      ) {
  
        if (
          r < BOX_SIZE &&
          isBoxComplete(
            r,
            c
          )
        ) {
  
          completed.push([
            r,
            c
          ]);
  
        }
  
  
        if (
          r > 0 &&
          isBoxComplete(
            r - 1,
            c
          )
        ) {
  
          completed.push([
            r - 1,
            c
          ]);
  
        }
  
      } else {
  
        if (
          c < BOX_SIZE &&
          isBoxComplete(
            r,
            c
          )
        ) {
  
          completed.push([
            r,
            c
          ]);
  
        }
  
  
        if (
          c > 0 &&
          isBoxComplete(
            r,
            c - 1
          )
        ) {
  
          completed.push([
            r,
            c - 1
          ]);
  
        }
  
      }
  
  
      return completed;
  
    }
  
  
    /* =========================================================
       CHECK BOX
    ========================================================= */
  
    function isBoxComplete(
      r,
      c
    ) {
  
      if (
        r < 0 ||
        c < 0 ||
        r >= BOX_SIZE ||
        c >= BOX_SIZE
      ) {
  
        return false;
  
      }
  
  
      return (
        horizontalLines[r][c] &&
        horizontalLines[r + 1][c] &&
        verticalLines[r][c] &&
        verticalLines[r][c + 1]
      );
  
    }
  
  
    /* =========================================================
       TURN FLOW
    ========================================================= */
  
    function switchTurn() {
  
      currentPlayer =
        currentPlayer === "player"
          ? "bot"
          : "player";
  
  
      animationLock =
        currentPlayer === "bot";
  
  
      updateStatus();
  
      renderBoard();
  
  
      if (
        currentPlayer === "bot" &&
        !gameOver
      ) {
  
        setTimeout(
          botMove,
          difficulty === "hard"
            ? 350
            : 550
        );
  
      }
  
    }
  
  
    function updateStatus() {
  
      if (gameOver) {
  
        statusEl.textContent =
          "Game over";
  
        return;
  
      }
  
  
      if (
        currentPlayer === "player"
      ) {
  
        statusEl.textContent =
          "Your move";
  
      } else {
  
        statusEl.textContent =
          "Bot is thinking…";
  
      }
  
    }
  
  
    /* =========================================================
       BOT
    ========================================================= */
  
    function getAvailableMoves() {
  
      const moves = [];
  
  
      for (
        let r = 0;
        r < GRID_SIZE;
        r++
      ) {
  
        for (
          let c = 0;
          c < GRID_SIZE - 1;
          c++
        ) {
  
          if (
            !horizontalLines[r][c]
          ) {
  
            moves.push({
              direction: "horizontal",
              r,
              c
            });
  
          }
  
        }
  
      }
  
  
      for (
        let r = 0;
        r < GRID_SIZE - 1;
        r++
      ) {
  
        for (
          let c = 0;
          c < GRID_SIZE;
          c++
        ) {
  
          if (
            !verticalLines[r][c]
          ) {
  
            moves.push({
              direction: "vertical",
              r,
              c
            });
  
          }
  
        }
  
      }
  
  
      return moves;
  
    }
  
  
    function botMove() {
  
      if (
        gameOver ||
        currentPlayer !== "bot"
      ) {
  
        animationLock = false;
  
        renderBoard();
  
        return;
  
      }
  
  
      const moves =
        getAvailableMoves();
  
  
      if (
        moves.length === 0
      ) {
  
        animationLock = false;
  
        checkGameOver();
  
        return;
  
      }
  
  
      let chosen;
  
  
      if (
        difficulty === "easy"
      ) {
  
        chosen =
          chooseEasyMove(
            moves
          );
  
      } else if (
        difficulty === "medium"
      ) {
  
        chosen =
          chooseMediumMove(
            moves
          );
  
      } else {
  
        chosen =
          chooseHardMove(
            moves
          );
  
      }
  
  
      if (!chosen) {
  
        chosen =
          chooseEasyMove(
            moves
          );
  
      }
  
  
      if (
        chosen.direction ===
        "horizontal"
      ) {
  
        horizontalLines[
          chosen.r
        ][
          chosen.c
        ] = "bot";
  
      } else {
  
        verticalLines[
          chosen.r
        ][
          chosen.c
        ] = "bot";
  
      }
  
  
      processMove(
        chosen.direction,
        chosen.r,
        chosen.c,
        "bot"
      );
  
    }
  
  
    /* =========================================================
       EASY BOT
    ========================================================= */
  
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
  
  
    /* =========================================================
       MEDIUM BOT
    ========================================================= */
  
    function chooseMediumMove(
      moves
    ) {
  
      const scoringMoves =
        moves.filter(
          move =>
            wouldCompleteBox(
              move
            )
        );
  
  
      if (
        scoringMoves.length > 0
      ) {
  
        return scoringMoves[
          Math.floor(
            Math.random() *
            scoringMoves.length
          )
        ];
  
      }
  
  
      const safeMoves =
        moves.filter(
          move =>
            !givesOpponentBox(
              move
            )
        );
  
  
      if (
        safeMoves.length > 0
      ) {
  
        return safeMoves[
          Math.floor(
            Math.random() *
            safeMoves.length
          )
        ];
  
      }
  
  
      return chooseEasyMove(
        moves
      );
  
    }
  
  
    /* =========================================================
       HARD BOT
    ========================================================= */
  
    function chooseHardMove(
      moves
    ) {
  
      let bestMoves = [];
  
      let bestScore =
        -Infinity;
  
  
      for (
        const move of moves
      ) {
  
        let score = 0;
  
  
        if (
          wouldCompleteBox(
            move
          )
        ) {
  
          score += 100;
  
        }
  
  
        if (
          givesOpponentBox(
            move
          )
        ) {
  
          score -= 70;
  
        }
  
  
        score +=
          evaluateMoveSafety(
            move
          );
  
  
        score +=
          Math.random() * 3;
  
  
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
  
  
    /* =========================================================
       BOT ANALYSIS
    ========================================================= */
  
    function wouldCompleteBox(
      move
    ) {
  
      if (
        move.direction ===
        "horizontal"
      ) {
  
        horizontalLines[
          move.r
        ][
          move.c
        ] = "temp";
  
  
        const result =
          findCompletedBoxes(
            move.direction,
            move.r,
            move.c
          ).length > 0;
  
  
        horizontalLines[
          move.r
        ][
          move.c
        ] = null;
  
  
        return result;
  
      }
  
  
      verticalLines[
        move.r
      ][
        move.c
      ] = "temp";
  
  
      const result =
        findCompletedBoxes(
          move.direction,
          move.r,
          move.c
        ).length > 0;
  
  
      verticalLines[
        move.r
      ][
        move.c
      ] = null;
  
  
      return result;
  
    }
  
  
    function givesOpponentBox(
      move
    ) {
  
      if (
        move.direction ===
        "horizontal"
      ) {
  
        horizontalLines[
          move.r
        ][
          move.c
        ] = "temp";
  
  
        const dangerous =
          createsFutureBox(
            move.direction,
            move.r,
            move.c
          );
  
  
        horizontalLines[
          move.r
        ][
          move.c
        ] = null;
  
  
        return dangerous;
  
      }
  
  
      verticalLines[
        move.r
      ][
        move.c
      ] = "temp";
  
  
      const dangerous =
        createsFutureBox(
          move.direction,
          move.r,
          move.c
        );
  
  
      verticalLines[
        move.r
      ][
        move.c
      ] = null;
  
  
      return dangerous;
  
    }
  
  
    function createsFutureBox(
      direction,
      r,
      c
    ) {
  
      const possibleBoxes = [];
  
  
      if (
        direction ===
        "horizontal"
      ) {
  
        if (
          r < BOX_SIZE &&
          c < BOX_SIZE
        ) {
  
          possibleBoxes.push([
            r,
            c
          ]);
  
        }
  
  
        if (
          r > 0 &&
          c < BOX_SIZE
        ) {
  
          possibleBoxes.push([
            r - 1,
            c
          ]);
  
        }
  
      } else {
  
        if (
          c < BOX_SIZE
        ) {
  
          possibleBoxes.push([
            r,
            c
          ]);
  
        }
  
  
        if (
          c > 0
        ) {
  
          possibleBoxes.push([
            r,
            c - 1
          ]);
  
        }
  
      }
  
  
      for (
        const [boxR, boxC]
        of possibleBoxes
      ) {
  
        if (
          boxes[boxR][boxC]
        ) {
  
          continue;
  
        }
  
  
        let sides = 0;
  
  
        if (
          horizontalLines[
            boxR
          ][
            boxC
          ]
        ) {
  
          sides++;
  
        }
  
  
        if (
          horizontalLines[
            boxR + 1
          ][
            boxC
          ]
        ) {
  
          sides++;
  
        }
  
  
        if (
          verticalLines[
            boxR
          ][
            boxC
          ]
        ) {
  
          sides++;
  
        }
  
  
        if (
          verticalLines[
            boxR
          ][
            boxC + 1
          ]
        ) {
  
          sides++;
  
        }
  
  
        if (
          sides === 3
        ) {
  
          return true;
  
        }
  
      }
  
  
      return false;
  
    }
  
  
    function evaluateMoveSafety(
      move
    ) {
  
      let score = 0;
  
  
      if (
        move.r >= 1 &&
        move.r <= 3 &&
        move.c >= 1 &&
        move.c <= 3
      ) {
  
        score += 5;
  
      }
  
  
      return score;
  
    }
  
  
    /* =========================================================
       SCORES
    ========================================================= */
  
    function updateScores() {
  
      playerScoreEl.textContent =
        playerScore;
  
      botScoreEl.textContent =
        botScore;
  
    }
  
  
    /* =========================================================
       GAME OVER
    ========================================================= */
  
    function checkGameOver() {
  
      const totalBoxes =
        playerScore +
        botScore;
  
  
      if (
        totalBoxes <
        BOX_SIZE * BOX_SIZE
      ) {
  
        return false;
  
      }
  
  
      gameOver = true;
  
      animationLock = false;
  
  
      let message;
  
  
      if (
        playerScore > botScore
      ) {
  
        message =
          "You win!";
  
        saveDotsBoxesWin();
  
        taphReact(
          "win"
        );
  
      } else if (
        botScore > playerScore
      ) {
  
        message =
          "The bot wins";
  
        taphReact(
          "lose"
        );
  
      } else {
  
        message =
          "It's a tie!";
  
        taphReact(
          "tie"
        );
  
      }
  
  
      overlayText.textContent =
        message;
  
  
      overlayScore.textContent =
        `You: ${playerScore}  •  Bot: ${botScore}`;
  
  
      overlay.classList.remove(
        "hidden"
      );
  
  
      updateStatus();
  
  
      return true;
  
    }
  
  
    /* =========================================================
       START GAME
    ========================================================= */
  
    function startGame() {
  
      dotsBoxesWinSaved = false;
  
      gameOver = false;
  
      animationLock = false;
  
      playerScore = 0;
  
      botScore = 0;
  
  
      /*
       * BLUE ALWAYS STARTS.
       * RED ALWAYS GOES SECOND.
       *
       * Player blue -> player starts
       * Player red  -> bot starts
       */
  
      if (
        playerColor === "blue"
      ) {
  
        currentPlayer =
          "player";
  
      } else {
  
        currentPlayer =
          "bot";
  
      }
  
  
      createGameBoard();
  
  
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
  
  
      updateScores();
  
      updateScoreColors();
  
  
      requestAnimationFrame(
        () => {
  
          renderBoard();
  
          updateStatus();
  
  
          if (
            currentPlayer === "bot"
          ) {
  
            animationLock = true;
  
  
            setTimeout(
              botMove,
              600
            );
  
          }
  
        }
      );
  
  
      clearChat();
  
  
      setTimeout(
        () => {
  
          addTaphMessage(
            "👀"
          );
  
        },
        100
      );
  
  
      setTimeout(
        () => {
  
          addTaphMessage(
            `You're ${playerColor}. ${playerColor === "blue" ? "You go first." : "Blue goes first."} Good luck 😈`
          );
  
        },
        500
      );
  
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
        "message-bubble";
  
  
      bubble.textContent =
        "…";
  
  
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

            box: [
                "🔥",
                "👀",
                "🫡",
                "💯",
                "😎"
            ],
        
            botBox: [
                "💀",
                "👀",
                "😭",
                "🤨",
                "😈"
            ],
        
            win: [
                "🎉",
                "🏆",
                "👑",
                "🔥",
                "🥳"
            ],
        
            lose: [
                "💀",
                "😭",
                "😔",
                "🫠",
                "😵"
            ],
        
            tie: [
                "🤝",
                "👀",
                "😐",
                "🫱🏻‍🫲🏽",
                "😶"
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
  
            taphTyping(
              () =>
                addTaphMessage(
                  "👋"
                )
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
       RESIZE
    ========================================================= */
  
    window.addEventListener(
      "resize",
      () => {
  
        if (
          !gameScreen.classList.contains(
            "hidden"
          )
        ) {
  
          renderBoard();
  
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