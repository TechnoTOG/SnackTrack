// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const mongoConnect = require('./db/mongodb'); // Assuming mongodb.js handles MongoDB connection

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const https = require('https');

https.get('https://api.ipify.org', (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Your public IP address is: ' + data);
  });
}).on('error', (e) => {
  console.log('Error: ' + e.message);
});

// MongoDB connection
mongoConnect();

const productsRoutes = require('./routes/products');
const transactionsRoutes = require('./routes/transactions');
const genQRRoutes = require('./routes/genQR');

app.use('/api', productsRoutes);
app.use('/api', transactionsRoutes);
app.use('/api', genQRRoutes);

// Dashboard route
app.get('/', (req, res) => {
    res.render('dashboard');
});

// Transaction route
app.get('/transactions', (req, res) => {
  res.render('transactions');
});

// Inventory/Item route
app.get('/items', (req, res) => {
  res.render('items');
});

// About route
app.get('/about', (req, res) => {
  res.render('about');
});

// QR-Display route
app.get('/qr-display', (req, res) => {
  res.render('qrDisplay');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
