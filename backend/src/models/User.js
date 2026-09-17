const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: [true, 'Google ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Virtual helper for profileImage / avatarUrl compatibility
userSchema.pre('save', function (next) {
  if (this.profileImage && !this.avatarUrl) {
    this.avatarUrl = this.profileImage;
  } else if (this.avatarUrl && !this.profileImage) {
    this.profileImage = this.avatarUrl;
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
