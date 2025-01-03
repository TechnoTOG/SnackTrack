const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const mongoConnect = require('../db/mongodb');

// Define the schema for products (with flexible fields)
const transactionSchema = new mongoose.Schema({}, { strict: false }); // Flexible schema

// Create a model for the "transactions" collection in the MongoDB
const Transaction = mongoose.model('Transaction', transactionSchema, 'transactions');

// Route to complete a transaction and automatically update a document
router.post('/complete-transaction', async (req, res) => {
    const { mongoID } = req.body; // Destructure mongoID from request body

    try {
        if (!mongoID) {
            return res.status(400).json({ message: 'mongoID is required' });
        }

        // Fetch the document to check if the "updatedAt" field exists
        const document = await Transaction.findById(mongoID).lean();

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Define the fields to be updated (only add "updatedAt" if it doesn't exist)
        const updateFields = {
            status: 'Completed',  // Set a fixed value for the status field
            updatedAt: document.updatedAt ? document.updatedAt : new Date(), // Only set "updatedAt" if not already present
        };

        // Update the document with the given mongoID and predefined fields
        const result = await Transaction.updateOne({ _id: mongoID }, { $set: updateFields });

        console.log(`Transaction with ID ${mongoID} completed successfuly`);

        res.status(200).json({
            message: `${result.modifiedCount} document(s) updated successfully.`,
            updatedFields: updateFields,
        });
    } catch (error) {
        console.error(error); // Log any error
        res.status(500).json({ message: 'Error completing the transaction or updating the document.' });
    }
});

module.exports = router;
