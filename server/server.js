require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connect } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/products", require("./routes/products"));
app.use("/suppliers", require("./routes/suppliers"));

app.use((req, res) =>
  res
    .status(404)
    .json({ error: `Route ${req.method} ${req.originalUrl} not found.` }),
);

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Malformed JSON in request body." });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: "Duplicate key violation." });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

connect()
  .then(() =>
    app.listen(PORT, () =>
      console.log(`API listening on http://localhost:${PORT}`),
    ),
  )
  .catch((err) => {
    console.error("Failed to start:", err.message);
    process.exit(1);
  });
