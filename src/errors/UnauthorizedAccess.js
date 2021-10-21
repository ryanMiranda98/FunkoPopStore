module.exports = function UnauthorizedAccess() {
  this.status = 401;
  this.message = "You are unauthorized to access this route";
};
