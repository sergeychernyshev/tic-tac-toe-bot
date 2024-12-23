import tmi from "tmi.js";

const channelName = "SergeyChernyshev";

const client = new tmi.Client({
  channels: [channelName],
});

client.connect();

console.log(
  `TicTacToe server script loaded, connected to Twitch chat for ${channelName} channel.`
);

// side selection helper
const otherSide = {
  x: "o",
  o: "x",
};

function resetBoard() {
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 3; row++) {
      board[col][row] = "";
    }
  }
}

function resetPlayersList() {
  players = {
    x: [],
    o: [],
  };
}

// game state
let board = [
  ["", "", ""],
  ["", "", ""],
  ["", "", ""],
];
let players = {
  x: [],
  o: [],
};
let turn = "";

export async function init(db) {
  // just for debugging
  //   db.changes({
  //     since: "now",
  //     live: true,
  //   }).on("change", (change) => {
  //     console.log("db has changed", change);

  //     db.get("tic-tac-toe")
  //       .then(function (doc) {
  //         console.table(doc.board);
  //       })
  //       .catch(function (err) {
  //         console.log("Game data not found");
  //       });
  //   });

  async function updateBoardUI(board, players, turn) {
    console.table(board);

    if (turn) {
      console.log(`[NEXT TURN] ${turn}'s turn: `, players[turn].join(", "));
    }

    await db
      .get("tic-tac-toe")
      .then(function (doc) {
        doc = { ...doc, board, players, turn };

        return db.put(doc);
      })
      .catch((err) => {
        const newDoc = {
          _id: "tic-tac-toe",
          board,
          players,
          turn,
        };

        db.put(newDoc);

        console.log("Game data not found. Initializing:", newDoc);
      });
  }

  console.log("TicTacToe Game Has started");
  await updateBoardUI(board, players, turn);

  // on new message, calculate the turn
  client.on("message", (channel, tags, message, self) => {
    processChatMessage(updateBoardUI, tags, message);
  });
}

async function processChatMessage(updateBoardUI, tags, message) {
  const player = tags["display-name"];
  // console.log(`[DEBUG] ${player}: ${message}`);

  const command = message.trim().toLowerCase();
  if (command.length === 4) {
    // determine if the move is for x or o
    if (command[1] !== " ") {
      console.log(
        `[INVALID COMMAND] Side and coordinates must be separated by a space`
      );
      return;
    }

    let side = false;
    if (command[0] === "x") {
      side = "x";
    } else if (command[0] === "o") {
      side = "o";
    }
    if (!side) {
      console.log(`[WRONG MOVE] Invalid side "${command[0]}" for ${player}`);
      return;
    }

    if (turn !== "" && turn !== side) {
      console.log(`[WRONG MOVE] It's not your turn, "${side}"`);
      return;
    }

    // determine the column
    let col;
    if (command[2] === "a") {
      col = 0;
    } else if (command[2] === "b") {
      col = 1;
    } else if (command[2] === "c") {
      col = 2;
    } else {
      console.log(
        `[INVALID COMMAND] Invalid column "${command[2]}", only letters A, B, C are allowed`
      );
      return;
    }

    // determine the column
    let row;
    if (command[3] === "1") {
      row = 0;
    } else if (command[3] === "2") {
      row = 1;
    } else if (command[3] === "3") {
      row = 2;
    } else {
      console.log(
        `[INVALID COMMAND] Invalid row "${command[3]}", only numbers 1, 2, 3 are allowed`
      );
      return;
    }

    let validSide = false;
    if (players[side].includes(player)) {
      // already playing for this side
      validSide = true;
    } else if (!players[otherSide[side]].includes(player)) {
      // not playing for the other side
      validSide = true;
      players[side].push(player);
    }

    if (!validSide) {
      console.log(
        `[WRONG MOVE] Same player can't play in the same game for both sides`
      );
      return;
    }

    if (board[row][col] !== "") {
      console.log(`[WRONG MOVE] Cell is already occupied`);
      return;
    }

    // valid move, let's mark it
    board[row][col] = side;

    // calculate conditions
    /**
     * @winner: false | x | o
     */
    let winner = false;
    /**
     * @draw: true | false
     */
    let draw = true;
    /**
     * @gameOver: true | false
     */
    let gameOver = true; // unless reset later

    // if it is one of the diagonals, no need to loop
    if (
      (board[0][0] === side && board[1][1] === side && board[2][2] === side) ||
      (board[0][2] === side && board[1][1] === side && board[2][0] === side)
    ) {
      winner = side;
    } else {
      for (let i = 0; i < 3; i++) {
        if (
          board[i][0] === side &&
          board[i][1] === side &&
          board[i][2] === side
        ) {
          winner = side;
        }
        if (
          board[0][i] === side &&
          board[1][i] === side &&
          board[2][i] === side
        ) {
          winner = side;
        }

        // draw happens only when all cells are occupied and there is no winner
        if (board[i][0] === "" || board[i][1] === "" || board[i][2] === "") {
          draw = false;
          gameOver = false;
        }
      }
    }

    // if there was a winner, it can't be a draw, but the game is over
    if (winner) {
      draw = false;
    }

    // if it is a draw or we have a winner, it is game over
    if (winner || draw) {
      gameOver = true;
    }

    if (winner) {
      console.log(
        `[GAME OVER] Winner: ${winner} (${players[winner].join(", ")})`
      );
    } else if (draw) {
      console.log(`[GAME OVER] It's a draw`);
    }

    if (gameOver) {
      // reset the game
      console.log("[RESETING THE GAME]");

      resetBoard();
      resetPlayersList();
      turn = "";
    } else {
      turn = otherSide[side];
    }
    await updateBoardUI(board, players, turn);
  }
}
