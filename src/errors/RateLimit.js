module.exports = function RateLimit(statusCode, message) {
	this.status = statusCode || 429;
	this.message = message;
};