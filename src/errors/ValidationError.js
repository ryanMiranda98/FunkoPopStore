module.exports = function validationError(errors) {
  this.status = 400;
  this.message = "Validation Failure";
  this.errors = errors;
};
