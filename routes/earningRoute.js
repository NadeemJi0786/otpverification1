const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

const checkInController = require('../controllers/checkInController');
const spinController = require('../controllers/spinController');
const earningController = require('../controllers/earningController');

// Daily Check-in
router.post('/daily-checkin', authMiddleware, checkInController.dailyCheckIn);
router.get('/checkin-stats', authMiddleware, checkInController.getCheckInStats);

// Spin Wheel
router.post('/spin-wheel', authMiddleware, spinController.spinWheel);
router.get('/spin-stats', authMiddleware, spinController.getSpinStats);

// Combined Earnings
router.get('/summary', authMiddleware, earningController.getEarningsSummary);

module.exports = router;