const mongoose = require("mongoose");

const FunkoPopSchema = new mongoose.Schema({
  title: {
    type: String,
    maxlength: 50,
    minlength: 10,
    required: true,
    trim: true
  },
  price: { type: Number, required: true },
  description: {
    type: String,
    maxlength: 250,
    minlength: 10,
    required: true,
    trim: true
  },
  quantity: { type: Number, required: true },
  instock: { type: Boolean, default: true, required: true },
  // coverImage: { type: String }
  // images: [{ type: String }]
});

module.exports = mongoose.model("FunkoPops", FunkoPopSchema);
