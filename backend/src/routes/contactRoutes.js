const express = require('express');
const router = express.Router();
const {
  submitContactForm,
  getContactMessagesAdmin,
  getContactMessageByIdAdmin,
  updateContactMessageStatusAdmin,
  deleteContactMessageAdmin,
} = require('../controllers/contactController');
const { protectUser } = require('../middlewares/authMiddleware');
const { protectAdmin } = require('../middlewares/adminMiddleware');

// Contact routes for student inquiries
// POST /api/v1/contact (Protected - Authenticated User Required)
router.post('/', protectUser, submitContactForm);

// Contact Admin routes
// GET /api/v1/contact/admin (Protected - Admin Required)
router.get('/admin', protectAdmin, getContactMessagesAdmin);
router.get('/admin/:id', protectAdmin, getContactMessageByIdAdmin);
router.patch('/admin/:id', protectAdmin, updateContactMessageStatusAdmin);
router.patch('/admin/:id/status', protectAdmin, updateContactMessageStatusAdmin);
router.delete('/admin/:id', protectAdmin, deleteContactMessageAdmin);

module.exports = router;

