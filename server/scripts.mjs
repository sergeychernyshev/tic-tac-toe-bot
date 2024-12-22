console.log("server script loaded");

export async function init(db) {
  console.log("server script initialized");

  function updateModel(change) {
    console.log("db has changed");

    db.get("tic-tac-toe")
      .then(function (doc) {
        console.table(doc.board);
      })
      .catch(function (err) {
        console.error(err);
      });
  }

  db.changes({
    since: "now",
    live: true,
  }).on("change", updateModel);

  const defaultData = {
    board: [
      ["", "", ""],
      ["", "X", ""],
      ["", "", "O"],
    ],
    players: {
      x: [],
      o: [],
    },
    turn: "",
  };

  const dbInit = async (err) => {
    // if we don't have a doc yet, create it
    db.put({
      _id: "tic-tac-toe",
      ...defaultData,
    });

    console.log("Game data not found. Initializing:", defaultData);
  };

  db.get("tic-tac-toe")
    .then(function (doc) {
      doc = { ...doc, ...defaultData };

      return db.put(doc);
    })
    .catch(dbInit);
}
