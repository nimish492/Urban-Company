const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: "Slot", required: true },
  carpenterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Carpenter",
    required: true,
  },
  status: {
    type: String,
    enum: ["Confirmation pending", "Cancelled", "Booked"],
    default: "Confirmation pending",
  },
  confirmMessage: { type: String, default: "" }, // Store the confirmation message
  bookedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Reservation", reservationSchema);
