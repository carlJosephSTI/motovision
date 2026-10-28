
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "MotoVision backend is running!",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "MotoVision backend",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MotoVision backend running on port ${PORT}`);
});
