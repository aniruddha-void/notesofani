const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Admin = require('../models/Admin');
const { generateToken, sendAuthCookie, clearAuthCookie, verifyToken } = require('../utils/jwt');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * POST /api/v1/auth/google
 * Authenticates Google OAuth ID token for normal users only.
 */
const googleAuth = async (req, res) => {
  try {
    const { idToken, googleId, email, name, avatarUrl } = req.body;

    let payload = null;

    // Verify Google ID token if provided
    if (idToken && process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.includes('dummy')) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: idToken,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const gPayload = ticket.getPayload();
        payload = {
          googleId: gPayload.sub,
          email: gPayload.email,
          name: gPayload.name,
          avatarUrl: gPayload.picture,
        };
      } catch (gErr) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid Google authentication token.',
        });
      }
    } else if (googleId && email && name) {
      // Development fallback when using direct OAuth payload
      payload = { googleId, email, name, avatarUrl: avatarUrl || '' };
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Google ID token or Google user details required.',
      });
    }

    // Find or create User in MongoDB
    let user = await User.findOne({ googleId: payload.googleId });
    if (!user) {
      // Check if email exists
      user = await User.findOne({ email: payload.email });
      if (user) {
        user.googleId = payload.googleId;
        user.name = payload.name;
        user.avatarUrl = payload.avatarUrl || user.avatarUrl;
        await user.save();
      } else {
        user = await User.create({
          googleId: payload.googleId,
          email: payload.email,
          name: payload.name,
          avatarUrl: payload.avatarUrl || '',
          role: 'user',
        });
      }
    }

    // Generate User JWT token
    const token = generateToken({ id: user._id, role: 'user', email: user.email });

    // Set secure HTTP-Only cookie named 'userToken'
    sendAuthCookie(res, 'userToken', token);

    return res.status(200).json({
      status: 'success',
      message: 'User authenticated successfully via Google.',
      user: {
        _id: user._id,
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: 'user',
      },
    });
  } catch (error) {
    console.error('[Google Auth Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Google authentication processing failed.',
      ...(process.env.NODE_ENV === 'development' && { details: error.message }),
    });
  }
};

/**
 * POST /api/v1/auth/admin/login
 * Email + Password login for administrators only.
 */
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Admin email and password are required.',
      });
    }

    // Find Admin document
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid admin credentials.',
      });
    }

    // Verify passwordHash with bcrypt
    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid admin credentials.',
      });
    }

    // Generate Admin JWT token
    const token = generateToken({ id: admin._id, role: 'admin', email: admin.email });

    // Set secure HTTP-Only cookie named 'adminToken'
    sendAuthCookie(res, 'adminToken', token);

    return res.status(200).json({
      status: 'success',
      message: 'Admin logged in successfully.',
      admin: {
        _id: admin._id,
        email: admin.email,
        name: admin.name,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('[Admin Login Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Admin login processing failed.',
      ...(process.env.NODE_ENV === 'development' && { details: error.message }),
    });
  }
};

/**
 * POST /api/v1/auth/logout
 * Clears userToken and adminToken HTTP-Only cookies.
 */
const logout = async (req, res) => {
  clearAuthCookie(res, 'userToken');
  clearAuthCookie(res, 'adminToken');
  return res.status(200).json({
    status: 'success',
    message: 'Logged out successfully.',
  });
};

/**
 * GET /api/v1/auth/me
 * Returns currently authenticated user or admin based on HTTP-only cookie.
 */
const getMe = async (req, res) => {
  try {
    const adminToken = req.cookies.adminToken;
    const userToken = req.cookies.userToken;

    if (adminToken) {
      try {
        const decoded = verifyToken(adminToken);
        if (decoded && decoded.role === 'admin') {
          const admin = await Admin.findById(decoded.id).select('-passwordHash -__v');
          if (admin) {
            return res.status(200).json({
              status: 'success',
              role: 'admin',
              account: admin,
            });
          }
        }
      } catch (err) {
        clearAuthCookie(res, 'adminToken');
      }
    }

    if (userToken) {
      try {
        const decoded = verifyToken(userToken);
        if (decoded && decoded.role === 'user') {
          const user = await User.findById(decoded.id).select('-__v');
          if (user) {
            return res.status(200).json({
              status: 'success',
              role: 'user',
              account: user,
            });
          }
        }
      } catch (err) {
        clearAuthCookie(res, 'userToken');
      }
    }

    return res.status(200).json({
      status: 'success',
      role: 'guest',
      account: null,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve session status.',
    });
  }
};

module.exports = {
  googleAuth,
  adminLogin,
  logout,
  getMe,
};
