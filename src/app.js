const express = require("express");
const path = require("path");
const fs = require("fs");
const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const vulnerableRoutes = require("./routes/vulnerable.routes");

const app = express();
const distDir = path.join(__dirname, "..", "dist-client");
const hasDist = fs.existsSync(path.join(distDir, "index.html"));

app.use(express.json());
app.use(healthRoutes);
app.use(authRoutes);
app.use(vulnerableRoutes);

if (hasDist) {
  app.use(express.static(distDir));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/auth") || req.path === "/health") {
      return next();
    }
    return res.sendFile(path.join(distDir, "index.html"));
  });
}

app.use((req, res) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/auth") || req.path === "/health") {
    return res.status(404).json({ error: "Not found" });
  }
  return res.status(404).send("Not found");
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
