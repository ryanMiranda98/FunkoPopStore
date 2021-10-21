module.exports = function UserAlreadyExists() {
  this.status = 400;
  this.message = "A user already exists with that email";
};
