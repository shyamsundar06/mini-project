const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

router.post('/tour-cost', expenseController.calculateTourCost);
router.post('/emergency-estimate', expenseController.estimateEmergencyExpense);

module.exports = router;
