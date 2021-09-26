const express = require("express");
const funkopopRouter = require("./routes/funkopop");

const ErrorHandler = require("./errors/ErrorHandler");
const RouteNotFoundError = require("./errors/RouteNotFound");

const app = express();

app.use(express.json());

// Routes
app.get("/", (req, res) => {
  return res.status(200).json({
    message: "Welcome to FunkoPops"
  });
});

app.use("/api/1.0/funkopops", funkopopRouter);

app.all("*", (req, res, next) => {
  return next(new RouteNotFoundError());
});

app.use(ErrorHandler);

module.exports = app;
