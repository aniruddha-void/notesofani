const fs = require('fs');
const path = require('path');
const Resource = require('../models/Resource');
const Subject = require('../models/Subject');
const Download = require('../models/Download');
const StorageFactory = require('../services/storage/storageFactory');
const bcrypt = require('bcryptjs');
const { generateToken, verifyToken } = require('../utils/jwt');

const getAuthenticatedUser = (req) => {
  if (req.user) return req.user;
  const token =
    req.cookies?.userToken ||
    (req.headers?.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
  if (!token) return null;
  try {
    const decoded = verifyToken(token);
    return decoded && decoded.role === 'user' ? decoded : null;
  } catch (err) {
    return null;
  }
};

const hasResourceAccess = (req, resourceId) => {
  if (req.admin) return true;
  const cookieName = `res_access_${resourceId}`;
  const token =
    req.cookies?.[cookieName] ||
    req.headers?.[`x-resource-access-${resourceId}`] ||
    req.headers?.[`x-resource-access-token`];
  if (!token) return false;
  try {
    const decoded = verifyToken(token);
    return Boolean(decoded && (decoded.resourceId === String(resourceId) || decoded.accessGranted));
  } catch (err) {
    return false;
  }
};

const getResources = async (req, res) => {
  try {
    const { search, subject, type, page = 1, limit = 12 } = req.query;

    const filter = { published: true };

    if (subject) {
      filter.subject = subject;
    }

    if (type) {
      filter.resourceType = type;
    }

    if (search && search.trim() !== '') {
      filter.$text = { $search: search.trim() };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const resourcesList = await Resource.find(filter)
      .populate('subject', 'name code description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Resource.countDocuments(filter);

    const authenticatedUser = getAuthenticatedUser(req);
    const isLoggedIn = Boolean(authenticatedUser);

    const processedResources = resourcesList.map((doc) => {
      const obj = doc.toObject({ virtuals: true });
      delete obj.passwordHash;
      const isProtected = Boolean(obj.passwordProtected);
      const isUnlocked = isLoggedIn && (!isProtected || hasResourceAccess(req, obj._id));
      if (!isUnlocked) {
        obj.fileUrl = '';
        obj.externalUrl = '';
        obj.isUnlocked = false;
      } else {
        obj.isUnlocked = true;
      }
      return obj;
    });

    return res.status(200).json({
      status: 'success',
      data: {
        resources: processedResources,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    console.error('[Get Resources Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve resources.',
      ...(process.env.NODE_ENV === 'development' && { details: error.message }),
    });
  }
};

const getResourceById = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findOne({ _id: id, published: true })
      .populate('subject', 'name code description');

    if (!resource) {
      return res.status(404).json({
        status: 'error',
        message: 'Resource not found or not published.',
      });
    }

    resource.viewsCount += 1;
    await resource.save();

    const resourceObj = resource.toObject({ virtuals: true });
    delete resourceObj.passwordHash;

    const authenticatedUser = getAuthenticatedUser(req);
    const isLoggedIn = Boolean(authenticatedUser);
    const isProtected = Boolean(resource.passwordProtected);
    const isUnlocked = isLoggedIn && (!isProtected || hasResourceAccess(req, resource._id));

    if (!isUnlocked) {
      resourceObj.fileUrl = '';
      resourceObj.externalUrl = '';
      resourceObj.isUnlocked = false;
    } else {
      resourceObj.isUnlocked = true;
    }

    return res.status(200).json({
      status: 'success',
      data: { resource: resourceObj },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch resource details.',
    });
  }
};

const isValidHttpUrl = (str) => {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

const createResource = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      resourceType,
      subjectId,
      status,
      published,
      sourceType,
      externalUrl,
      embedVideoUrl,
      passwordProtected,
      password,
    } = req.body;

    const targetType = resourceType || type;
    const OFFICIAL_TYPES = ['PDF', 'Video', 'PYQ', 'Google Drive', 'Useful Link'];

    if (!targetType || !OFFICIAL_TYPES.includes(targetType)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid or missing resource type '${targetType}'. Allowed types: ${OFFICIAL_TYPES.join(', ')}`,
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Resource title is required.',
      });
    }

    const targetSubjectId = subjectId || req.body.subject;
    const subjectDoc = await Subject.findById(targetSubjectId);
    if (!subjectDoc) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid subject specified.',
      });
    }

    const isPublished = published !== undefined ? Boolean(published) : status === 'Published';
    const isFileBased = targetType === 'PDF' || targetType === 'PYQ';

    const isProtected = passwordProtected === 'true' || passwordProtected === true;
    let hashedPassword = null;

    if (isProtected) {
      if (!password || typeof password !== 'string' || password.trim().length < 6) {
        return res.status(400).json({
          status: 'error',
          message: 'Resource password is required and must be at least 6 characters when protection is enabled.',
        });
      }
      hashedPassword = await bcrypt.hash(password.trim(), 10);
    }

    let fileUrl = '';
    let fileSize = 0;
    let finalExternalUrl = '';
    let finalSourceType = isFileBased ? 'upload' : 'external';

    if (isFileBased) {
      if (!req.file && !req.body.fileUrl) {
        return res.status(400).json({
          status: 'error',
          message: `A file upload is required for ${targetType} resource creation.`,
        });
      }
      if (req.file) {
        const storageService = StorageFactory.getStorageService();
        const folder = 'pdf';
        const uploadResult = await storageService.uploadFile(req.file, folder);
        fileUrl = uploadResult.url;
        fileSize = req.file.size || 0;
      } else {
        fileUrl = req.body.fileUrl;
        fileSize = req.body.fileSize || 1024;
      }
    } else {

      const rawUrl = (externalUrl !== undefined ? externalUrl : embedVideoUrl) || '';
      const trimmedUrl = rawUrl.trim();

      if (!isValidHttpUrl(trimmedUrl)) {
        return res.status(400).json({
          status: 'error',
          message: `A valid HTTP/HTTPS URL is required for ${targetType} resources.`,
        });
      }
      finalExternalUrl = trimmedUrl;
    }

    const newResource = await Resource.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      resourceType: targetType,
      subject: targetSubjectId,
      sourceType: finalSourceType,
      published: isPublished,
      fileUrl,
      fileSize,
      externalUrl: finalExternalUrl,
      createdBy: req.admin ? req.admin._id : null,
      passwordProtected: isProtected,
      passwordHash: hashedPassword,
    });

    const populatedResource = await Resource.findById(newResource._id).populate('subject', 'name code description');
    const resObj = populatedResource.toObject({ virtuals: true });
    delete resObj.passwordHash;

    return res.status(201).json({
      status: 'success',
      message: 'Resource created successfully.',
      data: { resource: resObj },
    });
  } catch (error) {
    console.error('[Create Resource Error]:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create resource.',
      ...(process.env.NODE_ENV === 'development' && { details: error.message }),
    });
  }
};

const updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      type,
      resourceType,
      subjectId,
      status,
      published,
      externalUrl,
      embedVideoUrl,
      passwordProtected,
      password,
    } = req.body;

    const resource = await Resource.findById(id).select('+passwordHash');
    if (!resource) {
      return res.status(404).json({
        status: 'error',
        message: 'Resource not found.',
      });
    }

    const targetType = resourceType || type || resource.resourceType;
    const OFFICIAL_TYPES = ['PDF', 'Video', 'PYQ', 'Google Drive', 'Useful Link'];

    if (!targetType || !OFFICIAL_TYPES.includes(targetType)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid resource type '${targetType}'. Allowed types: ${OFFICIAL_TYPES.join(', ')}`,
      });
    }

    if (title !== undefined) {
      if (!title || !title.trim()) {
        return res.status(400).json({
          status: 'error',
          message: 'Resource title cannot be empty.',
        });
      }
      resource.title = title.trim();
    }

    if (description !== undefined) resource.description = description.trim();
    if (subjectId) resource.subject = subjectId;
    if (published !== undefined) resource.published = Boolean(published);
    else if (status !== undefined) resource.published = status === 'Published';

    if (passwordProtected !== undefined) {
      const isProtected = passwordProtected === 'true' || passwordProtected === true;
      if (!isProtected) {
        resource.passwordProtected = false;
        resource.passwordHash = null;
      } else {
        resource.passwordProtected = true;
        if (password && typeof password === 'string' && password.trim().length > 0) {
          if (password.trim().length < 6) {
            return res.status(400).json({
              status: 'error',
              message: 'Resource password must be at least 6 characters.',
            });
          }
          resource.passwordHash = await bcrypt.hash(password.trim(), 10);
        } else if (!resource.passwordHash) {
          return res.status(400).json({
            status: 'error',
            message: 'A password is required when enabling protection.',
          });
        }

      }
    }

    const isFileBased = targetType === 'PDF' || targetType === 'PYQ';
    const storageService = StorageFactory.getStorageService();

    if (isFileBased) {
      resource.resourceType = targetType;
      resource.sourceType = 'upload';
      resource.externalUrl = '';

      if (req.file) {
        const oldFileUrl = resource.fileUrl;
        const folder = 'pdf';
        const uploadResult = await storageService.uploadFile(req.file, folder);

        resource.fileUrl = uploadResult.url;
        resource.fileSize = req.file.size || 0;

        if (oldFileUrl) {
          await storageService.deleteFile(oldFileUrl).catch((err) => {
            console.error('[Storage Cleanup Non-Fatal Error]:', err);
          });
        }
      } else {
        if (!resource.fileUrl) {
          return res.status(400).json({
            status: 'error',
            message: `A file is required for ${targetType} resources.`,
          });
        }
      }
    } else {

      const rawUrl = (externalUrl !== undefined ? externalUrl : embedVideoUrl) || '';
      const trimmedUrl = rawUrl ? rawUrl.trim() : resource.externalUrl;

      if (!isValidHttpUrl(trimmedUrl)) {
        return res.status(400).json({
          status: 'error',
          message: `A valid HTTP/HTTPS URL is required for ${targetType} resources.`,
        });
      }

      if (resource.fileUrl) {
        await storageService.deleteFile(resource.fileUrl).catch((err) => {
          console.error('[Storage Cleanup Non-Fatal Error]:', err);
        });
        resource.fileUrl = '';
        resource.fileSize = 0;
      }

      resource.resourceType = targetType;
      resource.sourceType = 'external';
      resource.externalUrl = trimmedUrl;
    }

    await resource.save();
    const updated = await Resource.findById(resource._id).populate('subject', 'name code description');
    const updatedObj = updated.toObject({ virtuals: true });
    delete updatedObj.passwordHash;

    return res.status(200).json({
      status: 'success',
      message: 'Resource updated successfully.',
      data: { resource: updatedObj },
    });
  } catch (error) {
    console.error('[Update Resource Error]:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: error.message,
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update resource.',
    });
  }
};

const updateResourceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, published } = req.body;

    const isPublished = published !== undefined ? Boolean(published) : status === 'Published';

    const resource = await Resource.findByIdAndUpdate(
      id,
      { published: isPublished },
      { new: true }
    ).populate('subject', 'name code description');

    if (!resource) {
      return res.status(404).json({
        status: 'error',
        message: 'Resource not found.',
      });
    }

    const resObj = resource.toObject({ virtuals: true });
    delete resObj.passwordHash;

    return res.status(200).json({
      status: 'success',
      message: `Resource status updated to ${isPublished ? 'Published' : 'Draft'}.`,
      data: { resource: resObj },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update resource status.',
    });
  }
};

const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({
        status: 'error',
        message: 'Resource not found.',
      });
    }

    if (resource.fileUrl) {
      const storageService = StorageFactory.getStorageService();
      await storageService.deleteFile(resource.fileUrl);
    }

    await Resource.findByIdAndDelete(id);

    return res.status(200).json({
      status: 'success',
      message: 'Resource deleted successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete resource.',
    });
  }
};

const verifyResourcePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body || {};

    const authenticatedUser = getAuthenticatedUser(req);
    if (!authenticatedUser) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please sign in with Google.',
      });
    }

    const resource = await Resource.findOne({ _id: id, published: true }).select('+passwordHash');

    if (!resource) {
      return res.status(404).json({
        status: 'error',
        message: 'Resource not found or not published.',
      });
    }

    if (!resource.passwordProtected) {
      return res.status(200).json({
        status: 'success',
        message: 'Resource is not password protected.',
        data: {
          isUnlocked: true,
          fileUrl: resource.fileUrl,
          externalUrl: resource.externalUrl,
        },
      });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Password is required.',
      });
    }

    const isMatch = await bcrypt.compare(password.trim(), resource.passwordHash || '');

    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect password. Please try again.',
      });
    }

    const token = generateToken({ resourceId: resource._id.toString(), accessGranted: true });

    const cookieName = `res_access_${resource._id.toString()}`;
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 4 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Password verified successfully.',
      data: {
        isUnlocked: true,
        fileUrl: resource.fileUrl,
        externalUrl: resource.externalUrl,
        accessToken: token,
      },
    });
  } catch (error) {
    console.error('[Verify Resource Password Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to verify password.',
    });
  }
};

const recordDownload = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const resource = await Resource.findOne({ _id: id, published: true }).select('+passwordHash');
    if (!resource) {
      return res.status(404).json({
        status: 'error',
        message: 'Resource not found or not published.',
      });
    }

    if (resource.passwordProtected && !hasResourceAccess(req, resource._id.toString())) {
      return res.status(403).json({
        status: 'error',
        message: 'Password authorization required to download this resource.',
      });
    }

    if (resource.sourceType === 'upload' && resource.fileUrl) {
      const storageService = StorageFactory.getStorageService();
      const fileStream = await storageService.getFileStream(resource.fileUrl);

      if (!fileStream) {
        return res.status(404).json({
          status: 'error',
          message: 'Requested resource file does not exist on storage provider.',
        });
      }

      await Download.create({
        user: userId,
        resource: resource._id,
        downloadedAt: new Date(),
      });

      resource.downloadsCount += 1;
      await resource.save();

      const ext = path.extname(resource.fileUrl).toLowerCase() || '.pdf';
      const safeTitle = resource.title.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim() || 'resource';
      const downloadFileName = `${safeTitle}${ext}`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
      return fileStream.pipe(res);
    } else if (resource.externalUrl) {

      await Download.create({
        user: userId,
        resource: resource._id,
        downloadedAt: new Date(),
      });

      resource.downloadsCount += 1;
      await resource.save();

      return res.status(200).json({
        status: 'success',
        message: 'Download recorded successfully.',
        data: {
          downloadUrl: resource.externalUrl,
          downloadsCount: resource.downloadsCount,
        },
      });
    } else {
      return res.status(404).json({
        status: 'error',
        message: 'No file or external link attached to this resource.',
      });
    }
  } catch (error) {
    console.error('[Download Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process resource download.',
    });
  }
};

const getAllResourcesAdmin = async (req, res) => {
  try {
    const { search, subject, type, page = 1, limit = 50 } = req.query;

    const filter = {};

    if (subject) {
      filter.subject = subject;
    }

    if (type) {
      filter.resourceType = type;
    }

    if (search && search.trim() !== '') {
      filter.$text = { $search: search.trim() };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const resourcesList = await Resource.find(filter)
      .populate('subject', 'name code description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Resource.countDocuments(filter);

    const cleanResources = resourcesList.map((doc) => {
      const obj = doc.toObject({ virtuals: true });
      delete obj.passwordHash;
      return obj;
    });

    return res.status(200).json({
      status: 'success',
      data: {
        resources: cleanResources,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    console.error('[Get Admin Resources Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve admin resources.',
      ...(process.env.NODE_ENV === 'development' && { details: error.message }),
    });
  }
};

const streamResourceFile = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findOne({ _id: id, published: true }).select('+passwordHash');
    if (!resource) {
      return res.status(404).json({
        status: 'error',
        message: 'Resource not found or not published.',
      });
    }

    if (resource.passwordProtected && !hasResourceAccess(req, resource._id.toString())) {
      return res.status(403).json({
        status: 'error',
        message: 'Password authorization required to access this resource.',
      });
    }

    if (resource.sourceType === 'upload' && resource.fileUrl) {
      const storageService = StorageFactory.getStorageService();
      const fileStream = await storageService.getFileStream(resource.fileUrl);

      if (!fileStream) {
        return res.status(404).json({
          status: 'error',
          message: 'Requested resource file does not exist on storage provider.',
        });
      }

      const ext = path.extname(resource.fileUrl).toLowerCase();
      let contentType = 'application/pdf';
      if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.webp') contentType = 'image/webp';

      const safeTitle = resource.title.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim() || 'resource';
      const fileName = `${safeTitle}${ext || '.pdf'}`;

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Content-Disposition');
      return fileStream.pipe(res);
    } else if (resource.externalUrl) {
      return res.status(200).json({
        status: 'success',
        data: { externalUrl: resource.externalUrl },
      });
    } else {
      return res.status(404).json({
        status: 'error',
        message: 'No file attached to this resource.',
      });
    }
  } catch (error) {
    console.error('[Stream Resource File Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to stream resource file.',
    });
  }
};

module.exports = {
  getResources,
  getResourceById,
  getAllResourcesAdmin,
  createResource,
  updateResource,
  updateResourceStatus,
  deleteResource,
  verifyResourcePassword,
  recordDownload,
  streamResourceFile,
  hasResourceAccess,
};

