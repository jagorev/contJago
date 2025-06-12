const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
    source: {
        type: String,
        required: true,
        enum: ['ripetizioni', 'pagamenti per lavori', 'regali', 'pagamenti online', 'refund', 'other']
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    notes: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Income', incomeSchema);