const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const placesRoutes = require('./routes/routePlace');
const purchasesRoutes = require('./routes/routePurchase');

const app = express();
const PORT = process.env.PORT || 5000;
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${PORT}`;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:3000', 
    'http://localhost:8080',
    `http://localhost:${PORT}`,
    'file://'
  ],
  credentials: true
}));
app.use(express.json());

// Serve static files from webapp directory
app.use(express.static(path.join(__dirname, 'webapp')));

// Database connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('Database connection error:', err));

// Config endpoint for frontend
app.get('/api/config', (req, res) => {
  res.json({
    apiBaseUrl: API_BASE_URL
  });
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'webapp', 'index.html'));
});

app.use('/api/places', placesRoutes);
app.use('/api/purchases', purchasesRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on ${API_BASE_URL}`);
});