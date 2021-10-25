module.exports = function JwtError(message) {
	this.status = 400;
	this.message = message || 'Error generating JWT';
};
