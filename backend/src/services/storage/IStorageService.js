class IStorageService {

  async uploadFile(file, folder) {
    throw new Error('Method uploadFile() must be implemented by Storage Adapter');
  }

  async deleteFile(keyOrUrl) {
    throw new Error('Method deleteFile() must be implemented by Storage Adapter');
  }

  async getFileStream(keyOrUrl) {
    throw new Error('Method getFileStream() must be implemented by Storage Adapter');
  }
}

module.exports = IStorageService;

