const express = require("express");
const { check } = require("express-validator");
const authController = require("../controllers/auth");
const loginMiddleware = require("../middleware/auth");
const passport = require("passport");

const router = express.Router();

router.post(
  "/signup",
  check("email")
    .notEmpty()
    .withMessage("Email cannot be empty")
    .bail()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .bail(),
  check("password")
    .notEmpty()
    .withMessage("Password cannot be empty")
    .bail()
    .isLength({ min: 8 })
    .withMessage("Password must be atleast 8 characters long"),
  authController.signup
);

router.post(
  "/signin",
  check("email")
    .notEmpty()
    .withMessage("Email cannot be empty")
    .bail()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .bail(),
  check("password")
    .notEmpty()
    .withMessage("Password cannot be empty")
    .bail()
    .isLength({ min: 8 })
    .withMessage("Password must be atleast 8 characters long"),
  loginMiddleware,
  passport.authenticate("jwt", { session: false }),
  authController.signin
);

module.exports = router;
