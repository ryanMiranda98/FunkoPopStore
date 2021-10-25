const express = require("express");
const { check } = require("express-validator");
const reviewController = require("../controllers/review");
const { isAuthenticated, isAllowed } = require("../middleware/auth");

const router = express.Router({ mergeParams: true });

router.post(
  "/",
  isAuthenticated,
  check("message")
    .notEmpty()
    .withMessage("Message cannot be empty")
    .bail()
    .isLength({ min: 4 })
    .withMessage("Message has to be atleast 4 characters long")
    .bail()
    .isLength({ max: 500 })
    .withMessage("Message cannot be more than 500 characters long")
    .bail(),
  reviewController.createReview
);
router.get("/", reviewController.getReviewsForProduct);

router.patch(
  "/:reviewId",
  isAuthenticated,
  check("message")
    .notEmpty()
    .withMessage("Message cannot be empty")
    .bail()
    .isLength({ min: 4 })
    .withMessage("Message has to be atleast 4 characters long")
    .bail()
    .isLength({ max: 500 })
    .withMessage("Message cannot be more than 500 characters long")
    .bail(),
  reviewController.editReview
);
router.delete("/:reviewId", isAuthenticated, reviewController.deleteReview);

module.exports = router;
