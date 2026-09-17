const path = require('path');
const fs = require('fs');
const IStorageService = require('./IStorageService');

/**
 * LocalStorageAdapter
 * Development storage adapter storing files on local server disk (/uploads).
 * Extends IStorageService.
 */
class LocalStorageAdapter extends IStorageService {
  constructor(uploadBaseDir = path.join(__dirname, '../../../uploads')) {
    super();
    this.uploadBaseDir = uploadBaseDir;
    if (!fs.existsSync(this.uploadBaseDir)) {
      fs.mkdirSync(this.uploadBaseDir, { recursive: true });
    }
  }

  /**
   * Saves a file to local server disk
   * @param {Object} file - Multer file object
   * @param {string} folder - Subfolder name (default: 'pdf')
   * @returns {Promise<{ url: string, key: string }>}
   */
  async uploadFile(file, folder = 'pdf') {
    const targetDir = path.join(this.uploadBaseDir, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const ext = path.extname(file.originalname || '');
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const targetPath = path.join(targetDir, uniqueName);

    if (file.buffer) {
      await fs.promises.writeFile(targetPath, file.buffer);
    } else if (file.path) {
      await fs.promises.rename(file.path, targetPath);
    } else {
      throw new Error('Invalid file payload provided to LocalStorageAdapter');
    }

    const relativeUrl = `/uploads/${folder}/${uniqueName}`;
    return {
      url: relativeUrl,
      key: `${folder}/${uniqueName}`
    };
  }

  /**
   * Deletes a file from local server disk
   * @param {string} keyOrUrl - File key or relative URL
   * @returns {Promise<boolean>}
   */
  async deleteFile(keyOrUrl) {
    if (!keyOrUrl) return false;
    const cleanPath = keyOrUrl.replace(/^\/uploads\//, '');
    const fullPath = path.join(this.uploadBaseDir, cleanPath);
    try {
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        return true;
      }
    } catch (err) {
      console.error(`[LocalStorageAdapter] Delete failed for ${fullPath}:`, err.message);
    }
    return false;
  }

  /**
   * Retrieves a readable stream for a local file
   * @param {string} keyOrUrl - File key or relative URL
   * @returns {Promise<import('stream').Readable|null>}
   */
  async getFileStream(keyOrUrl) {
    if (!keyOrUrl) return null;
    const cleanPath = keyOrUrl.replace(/^\/uploads\//, '');
    const fullPath = path.join(this.uploadBaseDir, cleanPath);
    try {
      if (fs.existsSync(fullPath)) {
        return fs.createReadStream(fullPath);
      }
    } catch (err) {
      console.error(`[LocalStorageAdapter] getFileStream failed for ${fullPath}:`, err.message);
    }
    return null;
  }
}

module.exports = LocalStorageAdapter;
