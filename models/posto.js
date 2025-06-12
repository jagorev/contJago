const mongoose = require('mongoose');

const postoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    trim: true
  },
  citta: {
    type: String,
    required: true,
    trim: true
  },
  indirizzo: {
    type: String,
    trim: true
  },
  note: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const Posto = mongoose.model('Posto', postoSchema);

module.exports = Posto;