const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Product",
    required: true
  },
  userId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
    required: true
  },
  message: {
    type: String,
    maxlength: 500,
    required: true
  },
  timestamp: {
    type: Date
  }
});

module.exports = mongoose.model("Reviews", ReviewSchema);
