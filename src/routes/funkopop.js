const express = require("express");
const funkoPopController = require("../controllers/funkopop");

const router = express.Router();

router.get("/", funkoPopController.getAllFunkoPops);
router.get("/:id", funkoPopController.getFunkoPopById);

module.exports = router;
