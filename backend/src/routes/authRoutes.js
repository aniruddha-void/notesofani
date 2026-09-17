const express = require('express');
const router = express.Router();
const { googleAuth, adminLogin, logout, getMe } = require('../controllers/authController');

// POST /api/v1/auth/google
router.post('/google', googleAuth);

// POST /api/v1/auth/admin/login
router.post('/admin/login', adminLogin);

// POST /api/v1/auth/logout
router.post('/logout', logout);

// GET /api/v1/auth/me
router.get('/me', getMe);

module.exports = router;
