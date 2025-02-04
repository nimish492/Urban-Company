const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const User = require("./models/user"); // Import User model
const Routes = require("./routes");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
app.set("io", io);
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(cors());

// Serve Socket.IO client script (optional, not needed for most cases)
app.get("/socket.io/socket.io.js", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "node_modules",
      "socket.io",
      "client-dist",
      "socket.io.js"
    )
  );
});

// Listen for WebSocket connections
io.on("connection", (socket) => {
  console.log("New client connected");

  // Example real-time event
  socket.on("slotUpdated", (data) => {
    console.log("Slot updated:", data);
    io.emit("slotUpdated", data); // Broadcast to all clients
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Database connection
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.log("Database connection failed:", err));

// ✅ Login Route
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || user.password !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id.toString() }, "your-secret-key", {
      expiresIn: "1h",
    });

    // ❌ No cookies, just send token in response
    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Logout Route
app.post("/api/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// Routes
app.use("/api", Routes);

// Start the server with `server.listen`, NOT `app.listen`
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
