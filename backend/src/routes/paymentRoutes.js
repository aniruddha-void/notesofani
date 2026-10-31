const express = require('express');
const router = express.Router();
const { getPublicPaymentConfig, getPaymentQrCode } = require('../controllers/paymentSettingController');

router.get('/config', getPublicPaymentConfig);
router.get('/qr-code', getPaymentQrCode);

module.exports = router;
