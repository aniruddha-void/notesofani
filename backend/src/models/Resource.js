const mongoose = require('mongoose');

const OFFICIAL_RESOURCE_TYPES = [
  'PDF',
  'Video',
  'PYQ',
  'Google Drive',
  'Useful Link',
];

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject reference is required'],
      index: true,
    },
    resourceType: {
      type: String,
      required: [true, 'Resource type is required'],
      enum: {
        values: OFFICIAL_RESOURCE_TYPES,
        message: '{VALUE} is not a valid resource type. Allowed types: PDF, Video, PYQ, Google Drive, Useful Link.',
      },
      index: true,
    },
    sourceType: {
      type: String,
      enum: {
        values: ['upload', 'external'],
        message: '{VALUE} is not a valid source type. Allowed: upload, external.',
      },
      default: 'upload',
    },
    fileUrl: {
      type: String,
      default: '',
    },
    externalUrl: {
      type: String,
      default: '',
    },
    published: {
      type: Boolean,
      default: false,
      index: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    downloadsCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    passwordProtected: {
      type: Boolean,
      default: false,
      index: true,
    },
    passwordHash: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual alias: type <-> resourceType
resourceSchema.virtual('type').get(function () {
  return this.resourceType;
}).set(function (v) {
  this.resourceType = v;
});

// Virtual alias: status <-> published
resourceSchema.virtual('status').get(function () {
  return this.published ? 'Published' : 'Draft';
}).set(function (v) {
  this.published = v === 'Published' || v === true;
});

// Indexes for performance
resourceSchema.index({ subject: 1, resourceType: 1, published: 1 });
resourceSchema.index({ published: 1, createdAt: -1 });
resourceSchema.index({ title: 'text', description: 'text' });

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource;
module.exports.OFFICIAL_RESOURCE_TYPES = OFFICIAL_RESOURCE_TYPES;
