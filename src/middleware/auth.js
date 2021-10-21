const { validationResult } = require("express-validator");

const User = require("../models/User");
const InvalidLogin = require("../errors/InvalidLogin");
const ValidationError = require("../errors/ValidationError");
const JwtError = require("../errors/JwtError");
const { comparePassword, generateJWT } = require("../utils/generators");

module.exports = async (req, res, next) => {
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
    req.headers["authorization"] = `Bearer ${token}`;

    next();
  } catch (error) {
    next(new JwtError(error.message));
  }
};
