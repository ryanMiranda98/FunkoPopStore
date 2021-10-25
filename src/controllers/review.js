const FunkPop = require("../models/FunkPop");
const Review = require("../models/Reviews");
const NoFunkoPopFound = require("../errors/NoFunkoPopFound");
const NoReviewFound = require("../errors/NoReviewFound");
const ForbiddenAccess = require("../errors/ForbiddenAccess");
const { validationResult } = require("express-validator");
const ValidationError = require("../errors/ValidationError");

const createReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const funkoPop = await FunkPop.findById(id);
    if (!funkoPop) {
      return next(new NoFunkoPopFound());
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors));
    }

    const review = new Review({
      productId: id,
      userId: req.user.id,
      message: message,
      timestamp: new Date().getTime()
    });
    await review.save();

    funkoPop.reviews.push(review.id);
    await funkoPop.save();

    return res.status(200).json({
      review
    });
  } catch (err) {
    next(err);
  }
};

const getReviewsForProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const funkoPop = await FunkPop.findById(id);
    if (!funkoPop) {
      return next(new NoFunkoPopFound());
    }

    const reviews = await Review.find({ productId: id }).limit(10);
    return res.status(200).json({ reviews });
  } catch (err) {
    next(err);
  }
};

const editReview = async (req, res, next) => {
  try {
    const { id, reviewId } = req.params;
    const { user } = req;

    const funkoPop = await FunkPop.findById(id);
    if (!funkoPop) {
      return next(new NoFunkoPopFound());
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return next(new NoReviewFound());
    }

    if (review.userId.toString() !== user.id) {
      return next(new ForbiddenAccess());
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors));
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      {
        message: req.body.message,
        timestamp: new Date().getTime()
      },
      { new: true }
    ).select("-__v");
    if (!updatedReview) {
      return res.status(404).json({});
    }

    return res.status(200).json({
      review: updatedReview
    });
  } catch (err) {
    next(err);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const { id, reviewId } = req.params;
    const { user } = req;

    const funkoPop = await FunkPop.findById(id);
    if (!funkoPop) {
      return next(new NoFunkoPopFound());
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return next(new NoReviewFound());
    }

    if (user.role !== "admin" && review.userId.toString() !== user.id) {
      return next(new ForbiddenAccess());
    }

    const deletedReview = await Review.findByIdAndDelete(reviewId).select(
      "-__v"
    );
    if (!deletedReview) {
      return res.status(404).json({});
    }

    return res.status(200).json({
      deletedReview
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReview,
  getReviewsForProduct,
  editReview,
  deleteReview
};
