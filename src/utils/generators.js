const config = require('config');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const jwtConfig = config.get('jwt');
jwt.sign = promisify(jwt.sign);
jwt.verify = promisify(jwt.verify);

const hashPassword = async (input) => {
	if (!input) {
		return null;
	}
	const rounds = 10;
	const salt = await bcrypt.genSalt(rounds);
	const hash = await bcrypt.hash(input, salt);

	return hash;
};

const comparePassword = async (password, savedPassword) => {
	if (!password || !savedPassword) {
		return false;
	}
	const compare = await bcrypt.compare(password, savedPassword);
	return compare;
};

const generateJWT = async (id) => {
	if (!id) {
		throw new Error('Invalid ID provided');
	}
	const token = await jwt.sign({ id }, jwtConfig.secret);
	if (!token) {
		throw new Error('Error generating JWT');
	}
	return token;
};

const verifyJWT = async (token) => {
	if (!token) {
		throw new Error('Invalid token provided');
	}
	const verifiedToken = await jwt.verify(token, jwtConfig.secret);
	if (!verifiedToken) {
		throw new Error('Error decoding JWT token');
	}
	return verifiedToken.id;
};

module.exports = {
	hashPassword,
	comparePassword,
	generateJWT,
	verifyJWT
};
