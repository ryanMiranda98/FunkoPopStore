module.exports = function ForbiddenAccess() {
  this.status = 403;
  this.message = "You are forbidden to access this route";
};
