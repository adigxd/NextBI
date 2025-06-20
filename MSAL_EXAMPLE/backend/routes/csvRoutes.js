const express = require('express');
const router = express.Router();
const csvController = require('../controllers/csvController');
const { authMiddleware } = require('../middleware/authMiddleware');
const multer = require('multer');

// Configure multer for memory storage (file will be in req.file.buffer)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
  },
  fileFilter: (req, file, cb) => {
    // Accept only csv files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Export survey to CSV
router.get('/export/:surveyId', authMiddleware, csvController.exportSurveyToCSV);

// Import survey from CSV
router.post('/import', authMiddleware, upload.single('file'), csvController.importSurveyFromCSV);

module.exports = router;
