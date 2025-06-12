const mongoose = require('mongoose');

const spesaSchema = new mongoose.Schema({
  posto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Posto',
    required: true
  },
  data: {
    type: Date,
    required: true,
    default: Date.now
  },
  importo: {
    type: Number,
    required: true,
    min: 0
  },
  note: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const Spesa = mongoose.model('Spesa', spesaSchema);

module.exports = Spesa;