const { validationResult } = require("express-validator");
const NoFunkoPopFound = require("../errors/NoFunkoPopFound");
const ValidationError = require("../errors/ValidationError");
const FunkoPops = require("../models/FunkPop");

const getAllFunkoPops = async (req, res, next) => {
  try {
    const funkopops = await FunkoPops.find().select("-__v");
    return res.status(200).json({
      funkopops,
      size: funkopops.length
    });
  } catch (err) {
    next(err);
  }
};

const getFunkoPopById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const funkopop = await FunkoPops.findById(id).select("-__v");
    if (!funkopop) {
      return next(new NoFunkoPopFound());
    }

    return res.status(200).json({
      funkopop
    });
  } catch (err) {
    next(err);
  }
};

const createFunkoPop = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors));
    }

    const { title, price, description, quantity } = req.body;
    const funkopop = await FunkoPops.create({
      title,
      price,
      description,
      quantity
    });

    return res.status(201).json({
      funkopop
    });
  } catch (err) {
    next(err);
  }
};

const editFunkoPop = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationError(errors));
    }

    const { id } = req.params;
    const { title, price, description, quantity } = req.body;
    const funkopop = await FunkoPops.findByIdAndUpdate(
      id,
      {
        title,
        price,
        description,
        quantity
      },
      { new: true }
    ).select("-__v");
    if (!funkopop) {
      return next(new NoFunkoPopFound());
    }

    return res.status(200).json({
      funkopop
    });
  } catch (err) {
    next(err);
  }
};

const deleteFunkoPop = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedFunkoPop = await FunkoPops.findByIdAndDelete(id).select(
      "-__v"
    );
    if (!deletedFunkoPop) {
      return res.status(204).json({});
    }

    return res.status(200).json({
      deletedFunkoPop
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllFunkoPops,
  getFunkoPopById,
  createFunkoPop,
  editFunkoPop,
  deleteFunkoPop
};
