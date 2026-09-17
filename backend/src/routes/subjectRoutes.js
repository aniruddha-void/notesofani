const express = require('express');
const router = express.Router();
const {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} = require('../controllers/subjectController');
const { protectAdmin } = require('../middlewares/adminMiddleware');

router.get('/', getSubjects);

router.post('/', protectAdmin, createSubject);
router.put('/:id', protectAdmin, updateSubject);
router.delete('/:id', protectAdmin, deleteSubject);

module.exports = router;

