require("dotenv").config(); // Load environment variables
const express = require("express");
const mongoose = require("mongoose");
const WebSocket = require("ws");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const http = require("http"); // Import the http module
const mongoConnect = require("./db/mongodb"); // MongoDB connection utility

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use(express.static(path.join(__dirname, "public"))); // Serve static files

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Fetch public IP
const https = require("https");
https
  .get("https://api.ipify.org", (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      console.log("Your public IP address is: " + data);
    });
  })
  .on("error", (e) => {
    console.log("Error: " + e.message);
  });

// MongoDB connection
mongoConnect(); // Assuming this connects to MongoDB using mongoose

// MongoDB collection reference
let devicesCollection;
mongoose.connection.once("open", () => {
  devicesCollection = mongoose.connection.db.collection("device_registrations");
  console.log("Connected to MongoDB, collection: device_registrations");
});

// Routes
const productsRoutes = require("./routes/products");
const transactionsRoutes = require("./routes/transactions");
const genQRRoutes = require("./routes/genQR");

app.use("/api", productsRoutes);
app.use("/api", transactionsRoutes);
app.use("/api", genQRRoutes);

// Dashboard route
app.get("/", (req, res) => {
  res.render("dashboard");
});

// Transaction route
app.get("/transactions", (req, res) => {
  res.render("transactions");
});

// Inventory/Item route
app.get("/items", (req, res) => {
  res.render("items");
});

// About route
app.get("/about", (req, res) => {
  res.render("about");
});

// QR-Display route
app.get("/qr-display", (req, res) => {
  res.render("qrDisplay");
});

// Create an HTTP server
const server = http.createServer(app);

// WebSocket server
const wss = new WebSocket.Server({ server });
const clients = new Map();

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");

  ws.on("message", (message) => {
    console.log("Received message from client:", message);
  });

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
  });
});

// Device registration endpoint
app.post("/api/register-device", async (req, res) => {
  const { uniqueId, deviceName, platform } = req.body;

  if (!uniqueId || !deviceName || !platform) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const existingDevice = await devicesCollection.findOne({ uniqueId });

    if (existingDevice) {
      return res.status(200).json({ message: "Device already registered" });
    }

    await devicesCollection.insertOne({
      uniqueId,
      deviceName,
      platform,
      registeredAt: new Date(),
    });

    console.log("Device registered:", { uniqueId, deviceName, platform });
    res.status(200).json({ message: "Device registered successfully" });
  } catch (error) {
    console.error("Error registering device:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API to send a notification
app.post("/api/send-notification", async (req, res) => {
  const { uniqueId, message } = req.body;

  if (!uniqueId || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const device = await devicesCollection.findOne({ uniqueId });

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    // Broadcast message to all WebSocket clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ uniqueId, message }));
      }
    });

    res.status(200).json({ message: "Notification sent successfully" });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
