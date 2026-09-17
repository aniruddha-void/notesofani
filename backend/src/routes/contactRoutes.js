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

router.post('/', protectUser, submitContactForm);

router.get('/admin', protectAdmin, getContactMessagesAdmin);
router.get('/admin/:id', protectAdmin, getContactMessageByIdAdmin);
router.patch('/admin/:id', protectAdmin, updateContactMessageStatusAdmin);
router.patch('/admin/:id/status', protectAdmin, updateContactMessageStatusAdmin);
router.delete('/admin/:id', protectAdmin, deleteContactMessageAdmin);

module.exports = router;

