const express = require('express');
const router = express.Router();
const { getStats, getUsersAdmin, getUserByIdAdmin } = require('../controllers/adminController');
const { getAllResourcesAdmin } = require('../controllers/resourceController');
const {
  getContactMessagesAdmin,
  getContactMessageByIdAdmin,
  updateContactMessageStatusAdmin,
  deleteContactMessageAdmin,
} = require('../controllers/contactController');
const { protectAdmin } = require('../middlewares/adminMiddleware');

router.use(protectAdmin);

router.get('/stats', getStats);
router.get('/resources', getAllResourcesAdmin);
router.get('/users', getUsersAdmin);
router.get('/users/:id', getUserByIdAdmin);

router.get('/contact-messages', getContactMessagesAdmin);
router.get('/contact-messages/:id', getContactMessageByIdAdmin);
router.patch('/contact-messages/:id/status', updateContactMessageStatusAdmin);
router.delete('/contact-messages/:id', deleteContactMessageAdmin);

module.exports = router;

