const mongoose = require('mongoose');

// Define the schema
const transactionSchema = new mongoose.Schema({}, { strict: false });

// Export the model
module.exports = mongoose.model('Transaction', transactionSchema);