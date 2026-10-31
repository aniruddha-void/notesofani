const mongoose = require('mongoose');

const PURCHASE_STATUSES = ['pending', 'approved', 'rejected'];

const purchaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: [true, 'Resource reference is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Purchase amount is required'],
      min: [0, 'Purchase amount cannot be negative'],
    },
    transactionId: {
      type: String,
      required: [true, 'UPI transaction/reference ID is required'],
      trim: true,
      index: true,
    },
    paymentNote: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Payment note cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: {
        values: PURCHASE_STATUSES,
        message: '{VALUE} is not a valid purchase status. Allowed: pending, approved, rejected.',
      },
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

purchaseSchema.index({ user: 1, resource: 1, status: 1 });
purchaseSchema.index({ status: 1, createdAt: -1 });

const Purchase = mongoose.model('Purchase', purchaseSchema);

module.exports = Purchase;
module.exports.PURCHASE_STATUSES = PURCHASE_STATUSES;
