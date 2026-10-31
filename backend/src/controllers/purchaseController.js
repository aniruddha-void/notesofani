const Purchase = require('../models/Purchase');
const Resource = require('../models/Resource');
const User = require('../models/User');
const {
  sendPurchaseRequestNotification,
  sendPurchaseStatusNotification,
} = require('../services/emailService');

const createPurchaseRequest = async (req, res) => {
  try {
    const { resourceId, transactionId, paymentNote } = req.body;

    if (!resourceId) {
      return res.status(400).json({
        status: 'error',
        message: 'Resource ID is required.',
      });
    }

    if (!transactionId || typeof transactionId !== 'string' || !transactionId.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'UPI transaction/reference ID is required.',
      });
    }

    const cleanTransactionId = transactionId.trim();
    if (cleanTransactionId.length < 4 || cleanTransactionId.length > 100) {
      return res.status(400).json({
        status: 'error',
        message: 'UPI transaction ID must be between 4 and 100 characters.',
      });
    }

    const userId = req.user._id;

    const resource = await Resource.findOne({ _id: resourceId, published: true });
    if (!resource) {
      return res.status(404).json({
        status: 'error',
        message: 'Resource not found or not published.',
      });
    }

    if (!resource.isPremium) {
      return res.status(400).json({
        status: 'error',
        message: 'This resource is free and does not require purchase.',
      });
    }

    const existingApproved = await Purchase.findOne({
      user: userId,
      resource: resourceId,
      status: 'approved',
    });

    if (existingApproved) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already purchased and unlocked this resource.',
      });
    }

    const existingPending = await Purchase.findOne({
      user: userId,
      resource: resourceId,
      status: 'pending',
    });

    if (existingPending) {
      return res.status(400).json({
        status: 'error',
        message: 'You already have a pending purchase request for this resource awaiting admin verification.',
      });
    }

    const priceAmount = resource.price;
    if (typeof priceAmount !== 'number' || priceAmount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Resource does not have a valid price configured.',
      });
    }

    const newPurchase = await Purchase.create({
      user: userId,
      resource: resource._id,
      amount: priceAmount,
      transactionId: cleanTransactionId,
      paymentNote: paymentNote && typeof paymentNote === 'string' ? paymentNote.trim().substring(0, 500) : '',
      status: 'pending',
    });

    const populatedPurchase = await Purchase.findById(newPurchase._id)
      .populate('user', 'name email avatarUrl')
      .populate('resource', 'title price resourceType');

    // Trigger async admin notification email (non-blocking)
    sendPurchaseRequestNotification({
      user: req.user,
      resource,
      purchase: populatedPurchase,
    }).catch((err) => {
      console.error('[Purchase Notification Error]:', err?.message || err);
    });

    return res.status(201).json({
      status: 'success',
      message: 'Purchase request submitted successfully. It will be verified by the admin shortly.',
      data: {
        purchase: populatedPurchase,
      },
    });
  } catch (error) {
    console.error('[Create Purchase Request Error]:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid resource ID provided.',
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Failed to submit purchase request.',
      ...(process.env.NODE_ENV === 'development' && { details: error.message }),
    });
  }
};

const getUserPurchases = async (req, res) => {
  try {
    const userId = req.user._id;

    const purchases = await Purchase.find({ user: userId })
      .populate({
        path: 'resource',
        populate: { path: 'subject', select: 'name code description' },
      })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      status: 'success',
      data: {
        purchases,
      },
    });
  } catch (error) {
    console.error('[Get User Purchases Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve your purchases.',
    });
  }
};

const getAdminPurchases = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;

    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');

      const [matchingUsers, matchingResources] = await Promise.all([
        User.find({ $or: [{ name: searchRegex }, { email: searchRegex }] }).select('_id'),
        Resource.find({ title: searchRegex }).select('_id'),
      ]);

      const userIds = matchingUsers.map((u) => u._id);
      const resourceIds = matchingResources.map((r) => r._id);

      query.$or = [
        { transactionId: searchRegex },
        { user: { $in: userIds } },
        { resource: { $in: resourceIds } },
      ];
    }

    const total = await Purchase.countDocuments(query);

    const purchases = await Purchase.find(query)
      .populate('user', 'name email avatarUrl profileImage')
      .populate({
        path: 'resource',
        populate: { path: 'subject', select: 'name code' },
      })
      .populate('reviewedBy', 'email')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      status: 'success',
      data: {
        purchases,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    console.error('[Get Admin Purchases Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve purchase requests.',
    });
  }
};

const getAdminPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await Purchase.findById(id)
      .populate('user', 'name email avatarUrl profileImage')
      .populate({
        path: 'resource',
        populate: { path: 'subject', select: 'name code' },
      })
      .populate('reviewedBy', 'email');

    if (!purchase) {
      return res.status(404).json({
        status: 'error',
        message: 'Purchase request not found.',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        purchase,
      },
    });
  } catch (error) {
    console.error('[Get Admin Purchase By Id Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve purchase details.',
    });
  }
};

const approvePurchaseAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await Purchase.findOneAndUpdate(
      { _id: id, status: 'pending' },
      {
        status: 'approved',
        reviewedBy: req.admin._id,
        reviewedAt: new Date(),
      },
      { new: true }
    )
      .populate('user', 'name email avatarUrl')
      .populate('resource', 'title price resourceType');

    if (!purchase) {
      const existing = await Purchase.findById(id);
      if (!existing) {
        return res.status(404).json({
          status: 'error',
          message: 'Purchase request not found.',
        });
      }
      return res.status(400).json({
        status: 'error',
        message: `Purchase request cannot be approved because it is already '${existing.status}'.`,
      });
    }

    if (purchase.user && purchase.user.email) {
      sendPurchaseStatusNotification({
        user: purchase.user,
        resource: purchase.resource,
        purchase,
        status: 'approved',
      }).catch((err) => {
        console.error('[Purchase Approval Email Error]:', err?.message || err);
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Purchase request approved successfully. Resource unlocked for user.',
      data: {
        purchase,
      },
    });
  } catch (error) {
    console.error('[Approve Purchase Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to approve purchase request.',
    });
  }
};

const rejectPurchaseAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};

    const purchase = await Purchase.findOneAndUpdate(
      { _id: id, status: 'pending' },
      {
        status: 'rejected',
        reviewedBy: req.admin._id,
        reviewedAt: new Date(),
        rejectionReason: reason ? String(reason).trim().substring(0, 300) : '',
      },
      { new: true }
    )
      .populate('user', 'name email avatarUrl')
      .populate('resource', 'title price resourceType');

    if (!purchase) {
      const existing = await Purchase.findById(id);
      if (!existing) {
        return res.status(404).json({
          status: 'error',
          message: 'Purchase request not found.',
        });
      }
      return res.status(400).json({
        status: 'error',
        message: `Purchase request cannot be rejected because it is already '${existing.status}'.`,
      });
    }

    if (purchase.user && purchase.user.email) {
      sendPurchaseStatusNotification({
        user: purchase.user,
        resource: purchase.resource,
        purchase,
        status: 'rejected',
        reason: purchase.rejectionReason,
      }).catch((err) => {
        console.error('[Purchase Rejection Email Error]:', err?.message || err);
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Purchase request rejected.',
      data: {
        purchase,
      },
    });
  } catch (error) {
    console.error('[Reject Purchase Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to reject purchase request.',
    });
  }
};

module.exports = {
  createPurchaseRequest,
  getUserPurchases,
  getAdminPurchases,
  getAdminPurchaseById,
  approvePurchaseAdmin,
  rejectPurchaseAdmin,
};
