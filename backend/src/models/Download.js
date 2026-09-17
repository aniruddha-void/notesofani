const mongoose = require('mongoose');

const downloadSchema = new mongoose.Schema(
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
    downloadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

downloadSchema.index({ user: 1, downloadedAt: -1 });
downloadSchema.index({ resource: 1, downloadedAt: -1 });

module.exports = mongoose.model('Download', downloadSchema);
