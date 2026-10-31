const mongoose = require('mongoose');

const paymentSettingSchema = new mongoose.Schema(
  {
    upiId: {
      type: String,
      default: '',
      trim: true,
    },
    payeeName: {
      type: String,
      default: '',
      trim: true,
    },
    qrCodeUrl: {
      type: String,
      default: '',
      trim: true,
    },
    paymentInstructions: {
      type: String,
      default: '1. Scan the PhonePe/UPI QR code or copy the UPI ID.\n2. Pay the exact resource amount via PhonePe, GPay, Paytm, or any UPI app.\n3. Copy the 12-digit UPI transaction reference ID / UTR number from your payment app.\n4. Enter the reference ID below and submit your purchase request.',
      trim: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PaymentSetting', paymentSettingSchema);
