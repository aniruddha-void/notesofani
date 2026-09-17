const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/resourceController');
const { protectUser } = require('../middlewares/authMiddleware');
const { protectAdmin } = require('../middlewares/adminMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/', getResources);
router.get('/:id', getResourceById);
router.post('/:id/verify-password', verifyResourcePassword);

router.get('/:id/file', protectUser, streamResourceFile);
router.route('/:id/download').get(protectUser, recordDownload).post(protectUser, recordDownload);

router.get('/admin/list', protectAdmin, getAllResourcesAdmin);
router.post('/', protectAdmin, upload.single('file'), createResource);
router.put('/:id', protectAdmin, upload.single('file'), updateResource);
router.patch('/:id/status', protectAdmin, updateResourceStatus);
router.delete('/:id', protectAdmin, deleteResource);

module.exports = router;

