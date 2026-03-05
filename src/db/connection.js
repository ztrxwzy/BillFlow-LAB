let db;

function setDb(instance) {
  db = instance;
}

function getDb() {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return db;
}

module.exports = {
  setDb,
  getDb
};
