const express = require('express');
const router = express.Router();
const {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} = require('../controllers/subjectController');
const { protectAdmin } = require('../middlewares/adminMiddleware');

// Public route
router.get('/', getSubjects);

// Admin-only routes
router.post('/', protectAdmin, createSubject);
router.put('/:id', protectAdmin, updateSubject);
router.delete('/:id', protectAdmin, deleteSubject);

module.exports = router;
