const express = require("express");
const { check } = require("express-validator");

const reviewRouter = require("./review");
const funkoPopController = require("../controllers/funkopop");
const { isAuthenticated, isAllowed } = require("../middleware/auth");

const router = express.Router();

router.get("/", funkoPopController.getAllFunkoPops);
router.get("/:id", funkoPopController.getFunkoPopById);

router.post(
  "/",
  isAuthenticated,
  isAllowed("admin"),
  check("title")
    .notEmpty()
    .withMessage("Cannot create funko pop without title!")
    .bail()
    .isLength({ min: 10, max: 50 })
    .withMessage("Title has to be 10-50 characters long")
    .bail()
    .trim(),
  check("price")
    .notEmpty()
    .withMessage("Cannot create funko pop without price!")
    .bail()
    .isNumeric()
    .withMessage("Price has to be numeric")
    .bail(),
  check("description")
    .notEmpty()
    .withMessage("Cannot create funko pop without decription!")
    .bail()
    .isLength({ min: 10, max: 250 })
    .withMessage("Description has to be 10-250 characters long")
    .bail()
    .trim(),
  check("quantity")
    .notEmpty()
    .withMessage("Cannot create funko pop without quantity!")
    .bail()
    .isNumeric()
    .withMessage("Quantity has to be numeric")
    .bail(),
  funkoPopController.createFunkoPop
);

router.patch(
  "/:id",
  isAuthenticated,
  isAllowed("admin"),
  check("title")
    .if(check("title").exists())
    .notEmpty()
    .withMessage("Cannot edit funko pop without title!")
    .bail()
    .isLength({ min: 10, max: 50 })
    .withMessage("Title has to be 10-50 characters long")
    .bail()
    .trim(),
  check("price")
    .if(check("price").exists())
    .notEmpty()
    .withMessage("Cannot edit funko pop without price!")
    .bail()
    .isNumeric()
    .withMessage("Price has to be numeric")
    .bail(),
  check("description")
    .if(check("description").exists())
    .notEmpty()
    .withMessage("Cannot edit funko pop without decription!")
    .bail()
    .isLength({ min: 10, max: 250 })
    .withMessage("Description has to be 10-250 characters long")
    .bail()
    .trim(),
  check("quantity")
    .if(check("quantity").exists())
    .notEmpty()
    .withMessage("Cannot edit funko pop without quantity!")
    .bail()
    .isNumeric()
    .withMessage("Quantity has to be numeric")
    .bail(),
  funkoPopController.editFunkoPop
);
router.delete(
  "/:id",
  isAuthenticated,
  isAllowed("admin"),
  funkoPopController.deleteFunkoPop
);

router.use("/:id/reviews", reviewRouter);

module.exports = router;
