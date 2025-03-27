const express = require('express');
const { getDashboardData } = require('../controllers/dashboard');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware
router.use(protect);

router.get('/', getDashboardData);

module.exports = router;