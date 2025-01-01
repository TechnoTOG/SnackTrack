const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const mongoConnect = require('../db/mongodb');

// Define the schema for products (with flexible fields)
const productSchema = new mongoose.Schema({}, { strict: false }); // Flexible schema

// Create a model for the "products" collection in the "snacktrack" database
const Product = mongoose.model('Product', productSchema, 'products');


// Route to fetch products
router.get('/products', async (req, res) => {
    try {
        // Fetch all products using Mongoose model
        const productList = await Product.find({}).lean();
        console.log(productList);  // Print the product list
        res.json(productList);  // Return the product list as JSON
    } catch (error) {
        console.error(error);  // Log any error
        res.status(500).json({ message: 'Error fetching products.' });  // Send error response
    }
});

module.exports = router;