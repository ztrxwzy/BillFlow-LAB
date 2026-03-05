const app = require("./app");
const { initDatabase } = require("./db/setup");
const { host, port } = require("./config");

initDatabase()
  .then(() => {
    app.listen(port, host, () => {
      console.log(`BillFlow API listening on http://${host}:${port}`);
      console.log("Mode: VULNERABLE ONLY");
    });
  })
  .catch((err) => {
    console.error("Failed to initialize DB", err);
    process.exit(1);
  });
