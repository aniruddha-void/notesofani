const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const protectUser = async (req, res, next) => {
  try {
    let token = req.cookies.userToken;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      const adminToken = req.cookies.adminToken;
      if (adminToken) {
        try {
          const decodedAdmin = verifyToken(adminToken);
          if (decodedAdmin && decodedAdmin.role === 'admin') {
            const Admin = require('../models/Admin');
            const admin = await Admin.findById(decodedAdmin.id).select('-passwordHash -__v');
            if (admin) {
              req.admin = admin;
              req.user = { _id: admin._id, name: admin.name || 'Admin', email: admin.email, role: 'admin' };
              return next();
            }
          }
        } catch (e) {}
      }

      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please sign in with Google.',
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired user session.',
      });
    }

    if (decoded.role === 'admin') {
      const Admin = require('../models/Admin');
      const admin = await Admin.findById(decoded.id).select('-passwordHash -__v');
      if (admin) {
        req.admin = admin;
        req.user = { _id: admin._id, name: admin.name || 'Admin', email: admin.email, role: 'admin' };
        return next();
      }
    }

    if (decoded.role !== 'user') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired user session.',
      });
    }

    const user = await User.findById(decoded.id).select('-__v');
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User account no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'User authentication failed.',
      ...(process.env.NODE_ENV === 'development' && { details: error.message }),
    });
  }
};

module.exports = { protectUser };

