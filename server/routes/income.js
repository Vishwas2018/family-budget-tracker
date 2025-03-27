const express = require('express');
const {
  getIncomes,
  getIncome,
  createIncome,
  updateIncome,
  deleteIncome
} = require('../controllers/income');
const { protect } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

router
  .route('/')
  .get(getIncomes)
  .post(createIncome);

router
  .route('/:id')
  .get(getIncome)
  .put(updateIncome)
  .delete(deleteIncome);

// Add import and export routes
router.post('/import', upload.single('file'), (req, res) => {
  // This is a placeholder endpoint for the import functionality
  // In a real implementation, you would:
  // 1. Process the uploaded file (using multer as we've added above)
  // 2. Parse the file data (with a library like xlsx or csv-parser)
  // 3. Validate the data
  // 4. Insert valid records into the database

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a file'
    });
  }

  // Just return a success response for now
  res.status(200).json({
    success: true,
    message: 'Import endpoint ready',
    data: {
      imported: 0  // This would be the actual count of imported records
    }
  });
});

router.get('/export', (req, res) => {
  // This is a placeholder endpoint for the export functionality
  // In a real implementation, you would:
  // 1. Query incomes based on the request filters
  // 2. Format the data for export
  // 3. Generate an Excel/CSV file
  // 4. Send the file as a response

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename=income_data.xlsx');
  res.send('This is a placeholder for income data export');
});

module.exports = router;