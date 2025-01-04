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

// Route to complete a transaction and automatically update a document
router.post('/cash-transaction', async (req, res) => {
    const { amt, tran_id, items, custname, itemcnt } = req.body;
    try {
        // Create and save the transaction
        const newTransaction = new Transaction({
            tran_id,
            custname,
            items,
            amount: amt,
            total_item: itemcnt,
            mode: "Cash",
            status: "Completed"
        });

        // Save the transaction and return the saved transaction object
        const savedTransaction = await newTransaction.save();
        console.log(`Transaction saved to MongoDB with _id: ${savedTransaction._id}, |Customer Name: ${custname}|, Mode: [Cash], Status: Completed`);
        res.status(200).json({message: 'Cash transaction completed successfully.',}); // Return the saved transaction with _id
    } catch (error) {
        console.error('Error saving transaction to MongoDB:', error);
        throw error;
    }
});

// Route to handle GET request for sales brief
router.get('/sales-brief', async (req, res) => {
    try {
        // Fetch only transactions with status "Completed"
        const completedTransactions = await Transaction.find().lean();

        // Aggregate the sales brief details
        const totalIncome = completedTransactions.filter(txn => txn.status === 'Completed').reduce((sum, txn) => sum + parseFloat(txn.amount), 0);
        const totalProductsSold = completedTransactions.reduce((sum, txn) => sum + parseInt(txn.total_item), 0);
        const totalTransactions = completedTransactions.length;
        const pendingTransactions = completedTransactions.filter(txn => txn.status === 'Pending').length;
        const totalCashTransactions = completedTransactions.filter(txn => txn.mode === 'Cash').length;
        const totalUPITransactions = completedTransactions.filter(txn => txn.mode === 'UPI').length;

        // Send the response
        res.json({
            totalIncome,
            totalProductsSold,
            totalTransactions,
            pendingTransactions,
            totalCashTransactions,
            totalUPITransactions
        });
    } catch (error) {
        console.error('Error fetching sales brief:', error);
        res.status(500).json({ error: 'Failed to fetch sales brief' });
    }
});

module.exports = router;
