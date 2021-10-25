const { validationResult } = require('express-validator');

const User = require('../models/User');
const InvalidLogin = require('../errors/InvalidLogin');
const ValidationError = require('../errors/ValidationError');
const UserNotFound = require('../errors/UserNotFound');
const UnauthorizedAccess = require('../errors/UnauthorizedAccess');
const ForbiddenAccess = require('../errors/ForbiddenAccess');
const JwtError = require('../errors/JwtError');
const {
	comparePassword,
	generateJWT,
	verifyJWT
} = require('../utils/generators');

const signinMiddleware = async (req, res, next) => {
	try {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return next(new ValidationError(errors));
		}

		const { email, password } = req.body;
		const user = await User.findOne({ email: email });
		if (!user) {
			return next(new InvalidLogin());
		}

		const passwordsMatch = await comparePassword(password, user.password);
		if (!passwordsMatch) {
			return next(new InvalidLogin());
		}

		const token = await generateJWT(user.id);

		req.token = token;
		req.headers['authorization'] = `Bearer ${token}`;

		next();
	} catch (error) {
		next(new JwtError(error.message));
	}
};

const isAuthenticated = async (req, res, next) => {
	if (req.user) {
		req.isAuthenticated = true;
		return next();
	}

	if (req.headers['authorization']) {
		const token = req.headers['authorization'].split('Bearer ')[1];
		const id = await verifyJWT(token);

		const user = await User.findById(id).select('-password');
		if (!user) {
			return next(new UserNotFound());
		}

		req.user = user;
		req.isAuthenticated = true;
		return next();
	}

	return next(new UnauthorizedAccess());
};

const isAllowed = (roles = []) => (req, res, next) => {
	if (roles.includes(req.user.role)) {
		return next();
	}

	return next(new ForbiddenAccess());
};

module.exports = {
	signinMiddleware,
	isAuthenticated,
	isAllowed
};
