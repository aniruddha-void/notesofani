const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const protectUser = async (req, res, next) => {
  try {
    let token = req.cookies.userToken;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please sign in with Google.',
      });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'user') {
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

