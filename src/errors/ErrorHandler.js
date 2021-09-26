module.exports = (err, req, res, next) => {
  const { status, message } = err;

  if (err.name === "CastError") {
    return res.status(404).json({
      path: req.originalPath,
      timestamp: new Date().getTime(),
      message: "Sorry! Could not find any funko pops with that ID"
    });
  }

  return res.status(status).json({
    path: req.originalPath,
    timestamp: new Date().getTime(),
    message: message
  });
};
