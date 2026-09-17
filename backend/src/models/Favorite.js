const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);

favoriteSchema.index({ user: 1, resource: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);

