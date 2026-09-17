const ContactMessage = require('../models/ContactMessage');
const { sendContactNotification } = require('../services/emailService');

/**
 * POST /api/v1/contact (Public)
 * Validates and records contact message in MongoDB & triggers email notification to admin.
 */
const submitContactForm = async (req, res) => {
  try {
    let { name, email, subject, message } = req.body || {};

    if (typeof name !== 'string') name = name ? String(name) : '';
    if (typeof email !== 'string') email = email ? String(email) : '';
    if (typeof subject !== 'string') subject = subject ? String(subject) : '';
    if (typeof message !== 'string') message = message ? String(message) : '';

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName) {
      return res.status(400).json({
        status: 'error',
        message: 'Name is required.',
      });
    }

    if (trimmedName.length > 100) {
      return res.status(400).json({
        status: 'error',
        message: 'Name cannot exceed 100 characters.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        status: 'error',
        message: 'A valid email address is required.',
      });
    }

    if (trimmedEmail.length > 255) {
      return res.status(400).json({
        status: 'error',
        message: 'Email address cannot exceed 255 characters.',
      });
    }

    if (!trimmedMessage) {
      return res.status(400).json({
        status: 'error',
        message: 'Message body is required.',
      });
    }

    if (trimmedMessage.length > 5000) {
      return res.status(400).json({
        status: 'error',
        message: 'Message body cannot exceed 5000 characters.',
      });
    }

    const finalSubject = trimmedSubject ? trimmedSubject.slice(0, 200) : 'General Inquiry';

    console.log('[Contact] Received authenticated contact submission');

    // Save ContactMessage in MongoDB with authenticated user reference
    const contactMessage = await ContactMessage.create({
      name: trimmedName,
      email: trimmedEmail,
      subject: finalSubject,
      message: trimmedMessage,
      status: 'Unread',
      user: req.user ? req.user._id : null,
    });

    console.log('[Contact] ContactMessage saved');

    // Attempt Nodemailer email send
    const emailResult = await sendContactNotification({
      name: contactMessage.name,
      email: contactMessage.email,
      subject: contactMessage.subject,
      message: contactMessage.message,
    });

    if (emailResult && emailResult.success) {
      return res.status(201).json({
        status: 'success',
        emailSent: true,
        message: 'Your message has been sent successfully.',
        data: {
          messageId: contactMessage._id,
          emailMessageId: emailResult.messageId,
          previewUrl: emailResult.previewUrl,
        },
      });
    } else {
      return res.status(201).json({
        status: 'warning',
        emailSent: false,
        message: 'Your message was saved, but the email notification could not be sent.',
        data: {
          messageId: contactMessage._id,
          emailError: emailResult ? emailResult.error : 'Unknown email error',
        },
      });
    }
  } catch (error) {
    console.error('[Submit Contact Error]:', error?.message || error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process contact submission.',
    });
  }
};

/**
 * GET /api/v1/admin/contact-messages (Admin Only)
 * Returns a list of contact messages with status filtering, regex search, and pagination.
 */
const getContactMessagesAdmin = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;

    let query = {};

    // Status filter
    if (status && status !== 'All') {
      // Support case-insensitive match for Unread/Read/Resolved
      const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      query.status = { $regex: new RegExp(`^${formattedStatus}$`, 'i') };
    }

    // Search filter
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { subject: searchRegex },
        { message: searchRegex },
      ];
    }

    const totalCount = await ContactMessage.countDocuments(query);
    const messages = await ContactMessage.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      status: 'success',
      data: {
        messages,
        pagination: {
          total: totalCount,
          page: pageNum,
          pages: Math.ceil(totalCount / limitNum) || 1,
          limit: limitNum,
        },
      },
    });
  } catch (error) {
    console.error('[Admin Get Contact Messages Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve contact messages.',
    });
  }
};

/**
 * GET /api/v1/admin/contact-messages/:id (Admin Only)
 * Returns a single contact message details by ID.
 */
const getContactMessageByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await ContactMessage.findById(id).lean();

    if (!message) {
      return res.status(404).json({
        status: 'error',
        message: 'Contact message not found.',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        message,
      },
    });
  } catch (error) {
    console.error('[Admin Get Contact Message By ID Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve contact message.',
    });
  }
};

/**
 * PATCH /api/v1/admin/contact-messages/:id/status (Admin Only)
 * Updates the status of a contact message (Unread, Read, Resolved).
 */
const updateContactMessageStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        status: 'error',
        message: 'Status field is required.',
      });
    }

    // Capitalize first letter to match model enum format (Unread, Read, Resolved)
    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    const message = await ContactMessage.findByIdAndUpdate(
      id,
      { status: formattedStatus },
      { new: true, runValidators: true }
    );

    if (!message) {
      return res.status(404).json({
        status: 'error',
        message: 'Contact message not found.',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: `Message status updated to ${formattedStatus}.`,
      data: {
        message,
      },
    });
  } catch (error) {
    console.error('[Admin Update Contact Message Status Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update message status.',
    });
  }
};

/**
 * DELETE /api/v1/admin/contact-messages/:id (Admin Only)
 * Deletes a contact message record.
 */
const deleteContactMessageAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await ContactMessage.findByIdAndDelete(id);

    if (!message) {
      return res.status(404).json({
        status: 'error',
        message: 'Contact message not found.',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Contact message deleted successfully.',
    });
  } catch (error) {
    console.error('[Admin Delete Contact Message Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete contact message.',
    });
  }
};

module.exports = {
  submitContactForm,
  getContactMessagesAdmin,
  getContactMessageByIdAdmin,
  updateContactMessageStatusAdmin,
  deleteContactMessageAdmin,
};

