const PaymentSetting = require('../models/PaymentSetting');
const StorageFactory = require('../services/storage/storageFactory');

const getPublicPaymentConfig = async (req, res) => {
  try {
    const setting = await PaymentSetting.findOne().sort({ updatedAt: -1 });

    const isConfigured = Boolean(setting && (setting.upiId?.trim() || setting.qrCodeUrl?.trim()));

    const version = setting?.updatedAt ? new Date(setting.updatedAt).getTime() : Date.now();
    const publicQrUrl = setting?.qrCodeUrl ? `/api/v1/payment/qr-code?v=${version}` : '';

    const configPayload = {
      isConfigured,
      upiId: setting?.upiId || '',
      payeeName: setting?.payeeName || '',
      qrCodeUrl: publicQrUrl,
      paymentInstructions:
        setting?.paymentInstructions ||
        '1. Scan the QR code or copy the UPI ID.\n2. Complete payment via any UPI app.\n3. Enter the 12-digit transaction reference ID below.',
      updatedAt: setting?.updatedAt || null,
    };

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.status(200).json({
      status: 'success',
      data: {
        ...configPayload,
        config: configPayload,
      },
    });
  } catch (error) {
    console.error('[Get Public Payment Config Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve payment configuration.',
    });
  }
};

const getPaymentQrCode = async (req, res) => {
  try {
    const setting = await PaymentSetting.findOne().sort({ updatedAt: -1 });
    if (!setting || !setting.qrCodeUrl) {
      return res.status(404).json({
        status: 'error',
        message: 'No QR code image has been configured.',
      });
    }

    const storageService = StorageFactory.getStorageService();
    const stream = await storageService.getFileStream(setting.qrCodeUrl);

    if (!stream) {
      return res.status(404).json({
        status: 'error',
        message: 'QR code image file not found in storage.',
      });
    }

    let contentType = 'image/jpeg';
    const lower = setting.qrCodeUrl.toLowerCase();
    if (lower.endsWith('.png')) contentType = 'image/png';
    else if (lower.endsWith('.webp')) contentType = 'image/webp';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    if (setting.updatedAt) {
      res.setHeader('Last-Modified', new Date(setting.updatedAt).toUTCString());
    }
    return stream.pipe(res);
  } catch (error) {
    console.error('[Get Payment QR Code Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve QR code image.',
    });
  }
};

const getAdminPaymentSettings = async (req, res) => {
  try {
    let setting = await PaymentSetting.findOne().sort({ updatedAt: -1 });
    if (!setting) {
      setting = await PaymentSetting.create({
        upiId: '',
        payeeName: '',
        qrCodeUrl: '',
        paymentInstructions: '1. Scan the PhonePe/UPI QR code or copy the UPI ID.\n2. Pay the exact resource amount via PhonePe, GPay, Paytm, or any UPI app.\n3. Copy the 12-digit UPI transaction reference ID / UTR number from your payment app.\n4. Enter the reference ID below and submit your purchase request.',
        updatedBy: req.admin ? req.admin._id : null,
      });
    }

    const version = setting.updatedAt ? new Date(setting.updatedAt).getTime() : Date.now();
    const settingObj = setting.toObject();
    if (settingObj.qrCodeUrl) {
      settingObj.qrCodeUrl = `/api/v1/payment/qr-code?v=${version}`;
    }

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.status(200).json({
      status: 'success',
      data: {
        paymentSetting: settingObj,
      },
    });
  } catch (error) {
    console.error('[Get Admin Payment Settings Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve payment settings.',
    });
  }
};

const updateAdminPaymentSettings = async (req, res) => {
  try {
    const { upiId, payeeName, paymentInstructions } = req.body;

    let setting = await PaymentSetting.findOne().sort({ updatedAt: -1 });
    if (!setting) {
      setting = new PaymentSetting();
    }

    if (upiId !== undefined) {
      setting.upiId = upiId.trim();
    }

    if (payeeName !== undefined) {
      setting.payeeName = payeeName.trim();
    }

    if (paymentInstructions !== undefined) {
      setting.paymentInstructions = paymentInstructions.trim();
    }

    if (req.file) {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedMimes.includes(req.file.mimetype)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid file type for QR code image. Allowed: PNG, JPEG, WEBP.',
        });
      }

      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          status: 'error',
          message: 'QR code image must be under 5MB in size.',
        });
      }

      const storageService = StorageFactory.getStorageService();
      const oldQr = setting.qrCodeUrl;
      const uploadResult = await storageService.uploadFile(req.file, 'payments');
      setting.qrCodeUrl = uploadResult.url;

      if (oldQr) {
        await storageService.deleteFile(oldQr).catch((err) => {
          console.error('[Payment QR Cleanup Non-Fatal Error]:', err.message || err);
        });
      }
    }

    setting.updatedBy = req.admin ? req.admin._id : null;
    await setting.save();

    // Ensure no conflicting or duplicate setting records exist
    await PaymentSetting.deleteMany({ _id: { $ne: setting._id } });

    const version = setting.updatedAt ? new Date(setting.updatedAt).getTime() : Date.now();
    const settingObj = setting.toObject();
    if (settingObj.qrCodeUrl) {
      settingObj.qrCodeUrl = `/api/v1/payment/qr-code?v=${version}`;
    }

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.status(200).json({
      status: 'success',
      message: 'Payment settings updated successfully.',
      data: {
        paymentSetting: settingObj,
      },
    });
  } catch (error) {
    console.error('[Update Admin Payment Settings Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update payment settings.',
      ...(process.env.NODE_ENV === 'development' && { details: error.message }),
    });
  }
};

module.exports = {
  getPublicPaymentConfig,
  getPaymentQrCode,
  getAdminPaymentSettings,
  updateAdminPaymentSettings,
};
