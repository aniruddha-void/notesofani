const { verifyToken } = require('../utils/jwt');
const Admin = require('../models/Admin');

/**
 * Admin Authentication & Authorization Middleware
 * Reads adminToken from HTTP-only cookie, verifies JWT, and attaches admin document to req.admin.
 * Strictly rejects non-admin users or Google OAuth users attempting to access admin endpoints.
 */
const protectAdmin = async (req, res, next) => {
  try {
    let token = req.cookies.adminToken;

    // Fallback check for Authorization header
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Admin authentication required. Please log in to admin portal.',
      });
    }

    // Verify admin token
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden. Access restricted to authorized administrators only.',
      });
    }

    // Find Admin in MongoDB
    const admin = await Admin.findById(decoded.id).select('-passwordHash -__v');
    if (!admin) {
      return res.status(401).json({
        status: 'error',
        message: 'Admin account not found.',
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Admin authentication failed.',
      ...(process.env.NODE_ENV === 'development' && { details: error.message }),
    });
  }
};

module.exports = { protectAdmin };
