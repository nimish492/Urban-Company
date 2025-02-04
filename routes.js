const express = require("express");
const Slot = require("./models/slot");
const Reservation = require("./models/reservation");
const Carpenter = require("./models/carpenter");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const router = express.Router();

// ✅ Middleware for JWT Authentication
const authenticate = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized: Please log in" });
  }
  next();
};

// ✅ Fetch all carpenters
router.get("/carpenters", async (req, res) => {
  try {
    const carpenters = await Carpenter.find();
    res.json(carpenters);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching carpenters", error: err.message });
  }
});

// ✅ Fetch all slots for a given carpenter
router.get("/slots/:carpenterId", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.carpenterId)) {
      return res.status(400).json({ message: "Invalid Carpenter ID" });
    }

    const slots = await Slot.find({ carpenterId: req.params.carpenterId });

    for (let slot of slots) {
      const reservation = await Reservation.findOne({ slotId: slot._id });
      slot.isAvailable = !reservation;
    }

    res.json(slots);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching slots", error: err.message });
  }
});

// ✅ Book a slot (Fixed)
// ✅ Book a slot (Fixed with real-time update)
router.post("/book", authenticate, async (req, res) => {
  try {
    console.log("User ID from JWT:", req.userId);

    const { slotId } = req.body;
    const userId = req.userId;

    // Validate slotId and userId
    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(slotId)
    ) {
      return res.status(400).json({ message: "Invalid User ID or Slot ID" });
    }

    const slot = await Slot.findById(slotId);
    if (!slot || !slot.isAvailable) {
      return res.status(400).json({ message: "Slot is unavailable" });
    }

    const reservation = new Reservation({
      userId,
      slotId,
      carpenterId: slot.carpenterId,
    });

    // Mark the slot as unavailable and save both documents
    slot.isAvailable = false;
    await slot.save();
    await reservation.save();

    // Notify all connected clients about the slot update
    const io = req.app.get("io");
    if (io) {
      io.emit("slotUpdated", { slotId, isAvailable: false });
    }

    res.status(200).json({ message: "Slot booked successfully" });
  } catch (err) {
    console.error("Error booking slot:", err);
    res.status(500).json({ message: "Error booking slot", error: err.message });
  }
});

// ✅ Fetch user reservations
router.get("/reservations", authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    const reservations = await Reservation.find({ userId })
      .populate("slotId")
      .populate("carpenterId", "name email phone image");

    res.json(reservations);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching reservations", error: error.message });
  }
});

// ✅ Cancel Reservation
// ✅ Cancel Reservation (with real-time update)
router.post("/cancel-reservation", authenticate, async (req, res) => {
  try {
    const { reservationId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reservationId)) {
      return res.status(400).json({ message: "Invalid Reservation ID" });
    }

    const reservation = await Reservation.findById(reservationId).populate(
      "slotId"
    );
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (reservation.slotId) {
      // Update the slot's availability to true
      await Slot.findByIdAndUpdate(reservation.slotId._id, {
        isAvailable: true,
      });

      // Notify all connected clients that the slot is now available
      const io = req.app.get("io");
      if (io) {
        io.emit("slotUpdated", {
          slotId: reservation.slotId._id,
          isAvailable: true,
        });
      }
    }

    // Delete the reservation
    await Reservation.findByIdAndDelete(reservationId);
    res.json({ message: "Reservation cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ✅ Confirm Reservation
router.post("/confirm-reservation", authenticate, async (req, res) => {
  try {
    const { reservationId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reservationId)) {
      return res.status(400).json({ message: "Invalid Reservation ID" });
    }

    const updatedReservation = await Reservation.findByIdAndUpdate(
      reservationId,
      { status: "Booked", confirmMessage: "Thank you for choosing me" },
      { new: true }
    );

    if (!updatedReservation)
      return res.status(404).json({ message: "Reservation not found" });

    res.json({
      message: "Reservation confirmed successfully",
      updatedReservation,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
