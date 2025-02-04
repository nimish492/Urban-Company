const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  carpenterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Carpenter",
    required: true,
  },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
});

const Slot = mongoose.model("Slot", slotSchema);
module.exports = Slot;
