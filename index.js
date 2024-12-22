import tmi from "tmi.js";

const client = new tmi.Client({
  channels: ["ChernyGoodsCo"],
});

client.connect();

const board = [
  ["", "", ""],
  ["", "", ""],
  ["", "", ""],
];

const players = {
  x: [],
  o: [],
};

client.on("message", (channel, tags, message, self) => {
  console.log(`${tags["display-name"]}: ${message}`);
  console.log(tags);

  const command = message.trim().toLowerCase();
  if (command.length == 3) {
    // determine if the move is for x or o
    let move = false;
    if (command.startsWith("x")) {
      move = "x";
    } else if (command.startsWith("o")) {
      move = "o";
    }

    if (!move) {
      return;
    }

    // determine the column
    let col;
    if (command[1] === "a") {
      col = 0;
    } else if (command[1] === "b") {
      col = 1;
    } else if (command[1] === "c") {
      col = 2;
    } else {
      return;
    }

    // determine the column
    let row;
    if (command[2] === "1") {
      row = 0;
    } else if (command[2] === "2") {
      row = 1;
    } else if (command[2] === "3") {
      row = 2;
    } else {
      return;
    }

    board[row][col] = move;

    console.table(board);
  }
});
