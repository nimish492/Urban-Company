const mongoose = require("mongoose");

const carpenterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  rating: { type: Number },
  experience: { type: String },
});

const Carpenter = mongoose.model("Carpenter", carpenterSchema);
module.exports = Carpenter;
