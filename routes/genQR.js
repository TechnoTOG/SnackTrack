const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const mongoConnect = require('../db/mongodb');

// Define the schema for transactions outside the function
const transactionSchema = new mongoose.Schema({}, { strict: false });

// Use a global model variable to prevent overwriting
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema, 'transactions');

// POST route to generate a QR code and save the transaction
router.post('/gen-qr', async (req, res) => {
    try {
        const { upi_id, amt, tran_id, items, custname, custmobile, itemcnt } = req.body;
        
        // Create the UPI URI for the QR code
        const UPI_URI = `upi://pay?pa=${upi_id}&pn=Invoice%20No:%20${tran_id}&am=${amt}&cu=INR`;

        // Generate a QR code as a base64 string
        const qrCodeData = await QRCode.toDataURL(UPI_URI, {
            color: {
                dark: '#000000', // Black dots
                light: '#ffffff', // White background
            },
            width: 300, // Custom size
        });

        // Save the transaction to the database and get the saved transaction
        const savedTransaction = await addTransaction(tran_id, custname, custmobile, upi_id, items, amt, itemcnt, qrCodeData);

        res.status(200).json({
            message: 'QR code generated and transaction saved successfully.',
            qrCode: qrCodeData,
            mongotransactionId: savedTransaction._id, // Include the _id in the response
        });
    } catch (error) {
        console.error('Error generating QR code or saving transaction:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Function to add a transaction to MongoDB
async function addTransaction(tran_id, custname, custmobile, payee, items, amount, total_item, qr) {
    try {
        // Create and save the transaction
        const newTransaction = new Transaction({
            tran_id,
            custname,
            custmobile,
            payee,
            items,
            amount,
            total_item,
            qr,
            mode: "UPI",
            status: "Pending",
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString()
        });

        // Save the transaction and return the saved transaction object
        const savedTransaction = await newTransaction.save();
        console.log(`Transaction saved to MongoDB with _id: ${savedTransaction._id}, |Customer Name: ${custname}|, Mode: [UPI], Status: Pending`);
        return savedTransaction; // Return the saved transaction with _id
    } catch (error) {
        console.error('Error saving transaction to MongoDB:', error);
        throw error;
    }
}

module.exports = router;