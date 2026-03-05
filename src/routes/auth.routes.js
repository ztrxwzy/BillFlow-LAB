const express = require("express");
const jwt = require("jsonwebtoken");
const { getDb } = require("../db/connection");
const { verifyPassword } = require("../utils/security");
const { jwtSecret } = require("../config");

const router = express.Router();

router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const db = getDb();
  const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    jwtSecret,
    { expiresIn: "4h" }
  );

  return res.json({ token });
});

module.exports = router;
