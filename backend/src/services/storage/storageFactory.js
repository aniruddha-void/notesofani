const LocalStorageAdapter = require('./LocalStorageAdapter');
const S3StorageAdapter = require('./S3StorageAdapter');

class StorageFactory {
  static getStorageService() {
    const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();

    switch (provider) {
      case 's3':
      case 'b2':
      case 'backblaze':
      case 'cloud':
      case 'aws':
        return new S3StorageAdapter();
      case 'local':
      default:
        return new LocalStorageAdapter();
    }
  }
}

module.exports = StorageFactory;

