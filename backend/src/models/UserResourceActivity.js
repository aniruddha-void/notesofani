const mongoose = require('mongoose');

const userResourceActivitySchema = new mongoose.Schema(
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
    lastViewedAt: {
      type: Date,
      default: Date.now,
    },
    viewCount: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique Index: prevents duplicate user-resource activity records
userResourceActivitySchema.index({ user: 1, resource: 1 }, { unique: true });
userResourceActivitySchema.index({ user: 1, lastViewedAt: -1 });

module.exports = mongoose.model('UserResourceActivity', userResourceActivitySchema);
