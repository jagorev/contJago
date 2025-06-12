const express = require('express');
const router = express.Router();
const Purchase = require('../models/purchase');

// GET all purchases
router.get('/', async (req, res) => {
  try {
    const purchases = await Purchase.find().populate('place');
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single purchase by ID
router.get('/:id', async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id).populate('place');
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    res.json(purchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new purchase
router.post('/', async (req, res) => {
  try {
    const purchase = new Purchase(req.body);
    const savedPurchase = await purchase.save();
    const populatedPurchase = await Purchase.findById(savedPurchase._id).populate('place');
    res.status(201).json(populatedPurchase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update purchase
router.put('/:id', async (req, res) => {
  try {
    const updatedPurchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedPurchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    const populatedPurchase = await Purchase.findById(updatedPurchase._id).populate('place');
    res.json(populatedPurchase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE purchase
router.delete('/:id', async (req, res) => {
  try {
    const deletedPurchase = await Purchase.findByIdAndDelete(req.params.id);
    if (!deletedPurchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    res.json({ message: 'Purchase deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;