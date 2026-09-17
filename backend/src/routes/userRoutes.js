const express = require('express');
const router = express.Router();
const {
  getFavorites,
  addFavorite,
  removeFavorite,
  getDownloadHistory,
  recordView,
  getDashboard,
  getProfile,
  updateProfile,
} = require('../controllers/userController');
const { protectUser } = require('../middlewares/authMiddleware');

router.use(protectUser);

router.get('/dashboard', getDashboard);
router.post('/views/:resourceId', recordView);

router.get('/favorites', getFavorites);
router.post('/favorites/:resourceId', addFavorite);
router.delete('/favorites/:resourceId', removeFavorite);

router.get('/downloads', getDownloadHistory);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router;

