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
const {
  getAdminPaymentSettings,
  updateAdminPaymentSettings,
} = require('../controllers/paymentSettingController');
const {
  getAdminPurchases,
  getAdminPurchaseById,
  approvePurchaseAdmin,
  rejectPurchaseAdmin,
} = require('../controllers/purchaseController');
const { protectAdmin } = require('../middlewares/adminMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.use(protectAdmin);

router.get('/stats', getStats);
router.get('/resources', getAllResourcesAdmin);
router.get('/users', getUsersAdmin);
router.get('/users/:id', getUserByIdAdmin);

router.get('/contact-messages', getContactMessagesAdmin);
router.get('/contact-messages/:id', getContactMessageByIdAdmin);
router.patch('/contact-messages/:id/status', updateContactMessageStatusAdmin);
router.delete('/contact-messages/:id', deleteContactMessageAdmin);

// Payment Settings
router.get('/payment-settings', getAdminPaymentSettings);
router.put('/payment-settings', upload.single('qrCode'), updateAdminPaymentSettings);
router.post('/payment-settings', upload.single('qrCode'), updateAdminPaymentSettings);

// Purchase Requests
router.get('/purchases', getAdminPurchases);
router.get('/purchases/:id', getAdminPurchaseById);
router.patch('/purchases/:id/approve', approvePurchaseAdmin);
router.patch('/purchases/:id/reject', rejectPurchaseAdmin);

module.exports = router;

