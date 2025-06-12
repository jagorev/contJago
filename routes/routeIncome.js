const express = require('express');
const router = express.Router();
const Income = require('../models/income');

// Ottieni tutte le entrate
router.get('/', async (req, res) => {
    try {
        const incomes = await Income.find().sort({ date: -1 });
        res.json(incomes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Crea una nuova entrata
router.post('/', async (req, res) => {
    const income = new Income({
        source: req.body.source,
        amount: req.body.amount,
        date: req.body.date,
        notes: req.body.notes
    });

    try {
        const newIncome = await income.save();
        res.status(201).json(newIncome);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Ottieni una singola entrata
router.get('/:id', getIncome, (req, res) => {
    res.json(res.income);
});

// Aggiorna un'entrata
router.put('/:id', getIncome, async (req, res) => {
    if (req.body.source != null) {
        res.income.source = req.body.source;
    }
    if (req.body.amount != null) {
        res.income.amount = req.body.amount;
    }
    if (req.body.date != null) {
        res.income.date = req.body.date;
    }
    if (req.body.notes != null) {
        res.income.notes = req.body.notes;
    }

    try {
        const updatedIncome = await res.income.save();
        res.json(updatedIncome);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Elimina un'entrata
router.delete('/:id', getIncome, async (req, res) => {
    try {
        await res.income.deleteOne();
        res.json({ message: 'Entrata eliminata' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Middleware per ottenere un'entrata per ID
async function getIncome(req, res, next) {
    let income;
    try {
        income = await Income.findById(req.params.id);
        if (income == null) {
            return res.status(404).json({ message: 'Entrata non trovata' });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }

    res.income = income;
    next();
}

module.exports = router;