const User = require('../models/User');
const { validationResult } = require('express-validator');
const ValidationError = require('../errors/ValidationError');
const UserAlreadyExists = require('../errors/UserAlreadyExists');
const { hashPassword } = require('../utils/generators');

const signup = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return next(new ValidationError(errors));
	}

	const { email, password } = req.body;
	const userExists = await User.findOne({ email: email });
	if (userExists) {
		return next(new UserAlreadyExists());
	}

	const user = new User({
		email
	});

	const hash = await hashPassword(password);
	user.password = hash;
	await user.save();

	return res.status(201).json({
		user
	});
};

const signin = async (req, res) => {
	const { user, token } = req;

	return res.status(200).json({
		user,
		token
	});
};

const getUser = async (req, res) => {
	const { user } = req;
	return res.status(200).json({ user });
};

module.exports = {
	signup,
	signin,
	getUser
};
