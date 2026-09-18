const LocalStorageAdapter = require('./LocalStorageAdapter');
const S3StorageAdapter = require('./S3StorageAdapter');

class StorageFactory {
  static getStorageService() {
    const provider = (process.env.STORAGE_PROVIDER || '').toLowerCase().trim();

    if (provider === 'local') {
      return new LocalStorageAdapter();
    }

    if (
      ['s3', 'b2', 'backblaze', 'cloud', 'aws'].includes(provider) ||
      process.env.B2_BUCKET_NAME ||
      process.env.B2_APPLICATION_KEY_ID ||
      process.env.AWS_S3_BUCKET ||
      process.env.AWS_ACCESS_KEY_ID
    ) {
      return new S3StorageAdapter();
    }

    return new LocalStorageAdapter();
  }
}

module.exports = StorageFactory;

