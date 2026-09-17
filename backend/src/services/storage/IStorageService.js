/**
 * IStorageService Base Class (Interface definition for JavaScript)
 * Standardizes file storage operations (upload & delete) across local and cloud environments.
 */
class IStorageService {
  /**
   * Upload a file
   * @param {Object} file - Multer file object or buffer payload
   * @param {string} folder - Subfolder/category name (e.g., 'pdf', 'thumbnails')
   * @returns {Promise<{ url: string, key: string }>}
   */
  async uploadFile(file, folder) {
    throw new Error('Method uploadFile() must be implemented by Storage Adapter');
  }

  /**
   * Delete a file
   * @param {string} keyOrUrl - File key or URL identifier
   * @returns {Promise<boolean>}
   */
  async deleteFile(keyOrUrl) {
    throw new Error('Method deleteFile() must be implemented by Storage Adapter');
  }

  /**
   * Retrieves a readable file stream
   * @param {string} keyOrUrl - File key or URL identifier
   * @returns {Promise<import('stream').Readable|null>}
   */
  async getFileStream(keyOrUrl) {
    throw new Error('Method getFileStream() must be implemented by Storage Adapter');
  }
}

module.exports = IStorageService;
