// routes/config.js
const express = require('express');
const router = express.Router();

// Import subcategories and categories from your categoryConfig.js
const { subcategories, categories } = require('../utils/categoryConfig');

// GET /api/config/categories
router.get('/categories', (req, res) => {
  res.status(200).json({
    success: true,
    subcategories,
    categories
  });
});

module.exports = router;