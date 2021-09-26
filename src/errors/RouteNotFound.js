module.exports = function RouteNotFound() {
  this.status = 404;
  this.message = "Sorry! Route not found";
};
