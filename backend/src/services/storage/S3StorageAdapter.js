const IStorageService = require('./IStorageService');

class S3StorageAdapter extends IStorageService {
  constructor(config = {}) {
    super();
    this.bucketName = config.bucketName || process.env.B2_BUCKET_NAME || process.env.AWS_S3_BUCKET;
    this.endpoint = config.endpoint || process.env.B2_ENDPOINT || process.env.AWS_ENDPOINT;
    this.region = config.region || process.env.B2_REGION || process.env.AWS_REGION || 'eu-central-003';
    this.accessKeyId = config.accessKeyId || process.env.B2_APPLICATION_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
    this.secretAccessKey = config.secretAccessKey || process.env.B2_APPLICATION_KEY || process.env.AWS_SECRET_ACCESS_KEY;
    this.s3Client = null;

    if (this.bucketName && this.accessKeyId && this.secretAccessKey) {
      try {
        const { S3Client } = require('@aws-sdk/client-s3');
        const clientOptions = {
          region: this.region,
          credentials: {
            accessKeyId: this.accessKeyId,
            secretAccessKey: this.secretAccessKey,
          },
        };

        if (this.endpoint) {
          clientOptions.endpoint = this.endpoint.startsWith('http')
            ? this.endpoint
            : `https://${this.endpoint}`;
        }

        this.s3Client = new S3Client(clientOptions);
      } catch (_) {

      }
    }
  }

  _verifyCredentials() {
    if (!this.bucketName || !this.accessKeyId || !this.secretAccessKey) {
      throw new Error(
        'Storage Provider Error: Missing object storage credentials or bucket configuration in environment variables. ' +
        'Please configure B2_BUCKET_NAME, B2_APPLICATION_KEY_ID, B2_APPLICATION_KEY (or AWS equivalent variables).'
      );
    }
  }

  async uploadFile(file, folder = 'pdf') {
    this._verifyCredentials();

    const originalName = file.originalname || 'file.pdf';
    const ext = originalName.includes('.') ? originalName.substring(originalName.lastIndexOf('.')) : '.pdf';
    const fileKey = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const contentType = file.mimetype || 'application/pdf';

    if (this.s3Client) {
      try {
        const { PutObjectCommand } = require('@aws-sdk/client-s3');
        const fs = require('fs');
        let body = file.buffer;
        if (!body && file.path) {
          body = fs.createReadStream(file.path);
        }

        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: fileKey,
          Body: body,
          ContentType: contentType,
        });

        await this.s3Client.send(command);
      } catch (err) {
        console.error('[StorageAdapter Upload Error]:', err.message || err);
        throw new Error(`Object Storage Upload failed: ${err.message || 'Unknown S3/B2 error'}`);
      }
    }

    let objectUrl = '';
    if (this.endpoint) {
      const cleanEndpoint = this.endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '');
      objectUrl = `https://${this.bucketName}.${cleanEndpoint}/${fileKey}`;
    } else {
      objectUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileKey}`;
    }

    return {
      url: objectUrl,
      key: fileKey,
    };
  }

  _extractKey(keyOrUrl) {
    if (!keyOrUrl) return '';
    let fileKey = keyOrUrl;
    if (keyOrUrl.includes('.backblazeb2.com/')) {
      const parts = keyOrUrl.split('.backblazeb2.com/');
      let relativePath = parts[1] || keyOrUrl;
      if (this.bucketName && relativePath.startsWith(`${this.bucketName}/`)) {
        relativePath = relativePath.substring(this.bucketName.length + 1);
      }
      fileKey = relativePath;
    } else if (keyOrUrl.includes('.amazonaws.com/')) {
      fileKey = keyOrUrl.split('.amazonaws.com/')[1];
    } else if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
      try {
        const u = new URL(keyOrUrl);
        fileKey = u.pathname.replace(/^\//, '');
        if (this.bucketName && fileKey.startsWith(`${this.bucketName}/`)) {
          fileKey = fileKey.substring(this.bucketName.length + 1);
        }
      } catch (_) {
        fileKey = keyOrUrl;
      }
    } else if (keyOrUrl.startsWith('/')) {
      fileKey = keyOrUrl.replace(/^\//, '');
    }
    return fileKey;
  }

  async deleteFile(keyOrUrl) {
    if (!keyOrUrl) return false;
    this._verifyCredentials();

    const fileKey = this._extractKey(keyOrUrl);

    if (this.s3Client) {
      try {
        const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
        const command = new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: fileKey,
        });
        await this.s3Client.send(command);
        return true;
      } catch (err) {
        console.error('[StorageAdapter Delete Error]:', err.message || err);
        return false;
      }
    }

    return true;
  }

  async getFileStream(keyOrUrl) {
    if (!keyOrUrl) return null;
    this._verifyCredentials();

    const fileKey = this._extractKey(keyOrUrl);

    if (this.s3Client) {
      try {
        const { GetObjectCommand } = require('@aws-sdk/client-s3');
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: fileKey,
        });
        const response = await this.s3Client.send(command);
        return response.Body;
      } catch (err) {
        console.error('[StorageAdapter GetStream Error]:', err.message || err);
        return null;
      }
    }

    return null;
  }
}

module.exports = S3StorageAdapter;

