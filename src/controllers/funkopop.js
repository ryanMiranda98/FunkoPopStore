const NoFunkoPopFound = require("../errors/NoFunkoPopFound");
const FunkoPops = require("../models/FunkPop");

const getAllFunkoPops = async (req, res, next) => {
  const funkopops = await FunkoPops.find().select("-__v");
  return res.status(200).json({
    funkopops,
    size: funkopops.length
  });
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

module.exports = {
  getAllFunkoPops,
  getFunkoPopById
};
