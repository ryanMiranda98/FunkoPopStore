module.exports = function InvalidLogin() {
	this.status = 400;
	this.message = 'Invalid email or password';
};
