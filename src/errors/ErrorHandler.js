module.exports = (err, req, res, next) => {
  let validationErrors = {};
  let { status, message, errors } = err;

  if (errors) {
    errors.array().forEach((error) => {
      validationErrors[error.param] = error.msg;
    });
  }

  if (err.name === "CastError") {
    status = 404;
    message = "Sorry! Could not find any funko pops with that ID";
  }

  return res.status(status).json({
    path: req.originalUrl,
    timestamp: new Date().getTime(),
    message: message,
    validationErrors
  });
};
