const express = require('express');
const router = express.Router();
const {
  createPurchaseRequest,
  getUserPurchases,
} = require('../controllers/purchaseController');
const { protectUser } = require('../middlewares/authMiddleware');

router.use(protectUser);

router.post('/', createPurchaseRequest);
router.get('/my', getUserPurchases);

module.exports = router;
