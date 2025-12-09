import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { AssetType } from '@/types';

// File type validation
const fileFilters: { [key: string]: AssetType[] } = {
  'image/jpeg': [AssetType.IMAGE],
  'image/jpg': [AssetType.IMAGE],
  'image/png': [AssetType.IMAGE],
  'image/gif': [AssetType.IMAGE],
  'image/webp': [AssetType.IMAGE],
  'audio/mpeg': [AssetType.AUDIO],
  'audio/mp3': [AssetType.AUDIO],
  'audio/wav': [AssetType.AUDIO],
  'video/mp4': [AssetType.VIDEO],
  'video/webm': [AssetType.VIDEO],
  'video/quicktime': [AssetType.VIDEO],
  'application/zip': [AssetType.COMPONENT],
  'application/json': [AssetType.COMPONENT],
  'text/javascript': [AssetType.COMPONENT],
  'text/html': [AssetType.COMPONENT],
  'text/css': [AssetType.COMPONENT],
};

export class FileUploadService {
  private readonly uploadPath: string;
  private readonly maxFileSize: number;

  constructor() {
    this.uploadPath = process.env.UPLOAD_PATH || './uploads';
    this.maxFileSize = this.parseFileSize(process.env.UPLOAD_MAX_SIZE || '50MB');
    this.ensureUploadDirectory();
  }

  private parseFileSize(sizeStr: string): number {
    const units: { [key: string]: number } = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
    };

    const match = sizeStr.match(/^(\d+)(B|KB|MB|GB)$/i);
    if (!match) {
      return 50 * 1024 * 1024; // Default 50MB
    }

    const [, size, unit] = match;
    return parseInt(size) * (units[unit.toUpperCase()] || 1);
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadPath);
    } catch (error) {
      await fs.mkdir(this.uploadPath, { recursive: true });
    }

    // Create subdirectories for different asset types
    const subdirs = ['images', 'audio', 'video', 'components', 'temp'];
    for (const subdir of subdirs) {
      const fullPath = path.join(this.uploadPath, subdir);
      try {
        await fs.access(fullPath);
      } catch (error) {
        await fs.mkdir(fullPath, { recursive: true });
      }
    }
  }

  getMulterConfig(assetType?: AssetType): multer.Options {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const subdir = this.getSubdirectory(file.mimetype, assetType);
        const uploadDir = path.join(this.uploadPath, subdir);
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueId = uuidv4();
        const ext = path.extname(file.originalname);
        const filename = `${uniqueId}${ext}`;
        cb(null, filename);
      },
    });

    const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      const allowedTypes = fileFilters[file.mimetype];

      if (!allowedTypes) {
        return cb(new Error(`Unsupported file type: ${file.mimetype}`));
      }

      if (assetType && !allowedTypes.includes(assetType)) {
        return cb(new Error(`File type ${file.mimetype} is not allowed for asset type ${assetType}`));
      }

      cb(null, true);
    };

    return {
      storage,
      fileFilter,
      limits: {
        fileSize: this.maxFileSize,
        files: 10, // Maximum 10 files per request
      },
    };
  }

  private getSubdirectory(mimetype: string, assetType?: AssetType): string {
    if (assetType) {
      const subdirMap: { [key in AssetType]: string } = {
        [AssetType.IMAGE]: 'images',
        [AssetType.AUDIO]: 'audio',
        [AssetType.VIDEO]: 'video',
        [AssetType.ANIMATION]: 'video', // Animations often stored as videos
        [AssetType.COMPONENT]: 'components',
      };
      return subdirMap[assetType];
    }

    // Auto-detect based on MIME type
    if (mimetype.startsWith('image/')) return 'images';
    if (mimetype.startsWith('audio/')) return 'audio';
    if (mimetype.startsWith('video/')) return 'video';
    return 'components';
  }

  async validateFile(filePath: string, assetType: AssetType): Promise<{
    isValid: boolean;
    error?: string;
    metadata?: any;
  }> {
    try {
      const stats = await fs.stat(filePath);
      const file = await fs.readFile(filePath);

      // Basic file validation
      if (stats.size === 0) {
        return { isValid: false, error: 'File is empty' };
      }

      // Additional validation based on asset type
      let metadata: any = {
        size: stats.size,
        lastModified: stats.mtime,
      };

      switch (assetType) {
        case AssetType.IMAGE:
          metadata = await this.validateImage(filePath, metadata);
          break;
        case AssetType.AUDIO:
          metadata = await this.validateAudio(filePath, metadata);
          break;
        case AssetType.VIDEO:
          metadata = await this.validateVideo(filePath, metadata);
          break;
        default:
          break;
      }

      return { isValid: true, metadata };
    } catch (error: any) {
      return { isValid: false, error: error.message };
    }
  }

  private async validateImage(filePath: string, metadata: any): Promise<any> {
    try {
      // Basic image validation could use Sharp or similar library
      // For now, just check file extension and size
      const ext = path.extname(filePath).toLowerCase();
      const validExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

      if (!validExts.includes(ext)) {
        throw new Error('Invalid image format');
      }

      // Add image-specific metadata
      metadata.format = ext.substring(1).toUpperCase();

      return metadata;
    } catch (error: any) {
      throw new Error(`Image validation failed: ${error.message}`);
    }
  }

  private async validateAudio(filePath: string, metadata: any): Promise<any> {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const validExts = ['.mp3', '.wav', '.ogg'];

      if (!validExts.includes(ext)) {
        throw new Error('Invalid audio format');
      }

      metadata.format = ext.substring(1).toUpperCase();
      metadata.duration = 'Unknown'; // Would need audio processing library

      return metadata;
    } catch (error: any) {
      throw new Error(`Audio validation failed: ${error.message}`);
    }
  }

  private async validateVideo(filePath: string, metadata: any): Promise<any> {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const validExts = ['.mp4', '.webm', '.mov'];

      if (!validExts.includes(ext)) {
        throw new Error('Invalid video format');
      }

      metadata.format = ext.substring(1).toUpperCase();
      metadata.duration = 'Unknown'; // Would need video processing library

      return metadata;
    } catch (error: any) {
      throw new Error(`Video validation failed: ${error.message}`);
    }
  }

  async deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      await fs.unlink(filePath);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to delete file: ${error.message}`
      };
    }
  }

  async moveFile(oldPath: string, newPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Ensure destination directory exists
      const destDir = path.dirname(newPath);
      await fs.mkdir(destDir, { recursive: true });

      await fs.rename(oldPath, newPath);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to move file: ${error.message}`
      };
    }
  }

  async getFileInfo(filePath: string): Promise<{
    exists: boolean;
    size?: number;
    modified?: Date;
    type?: string;
  }> {
    try {
      const stats = await fs.stat(filePath);
      return {
        exists: true,
        size: stats.size,
        modified: stats.mtime,
        type: path.extname(filePath),
      };
    } catch (error) {
      return { exists: false };
    }
  }

  generatePublicUrl(filePath: string): string {
    // Convert local file path to public URL
    const relativePath = path.relative(this.uploadPath, filePath);
    return `/uploads/${relativePath.replace(/\\/g, '/')}`;
  }

  getAssetTypeFromMimetype(mimetype: string): AssetType | null {
    const typeMap: { [key: string]: AssetType } = {
      'image/jpeg': AssetType.IMAGE,
      'image/jpg': AssetType.IMAGE,
      'image/png': AssetType.IMAGE,
      'image/gif': AssetType.IMAGE,
      'image/webp': AssetType.IMAGE,
      'audio/mpeg': AssetType.AUDIO,
      'audio/mp3': AssetType.AUDIO,
      'audio/wav': AssetType.AUDIO,
      'video/mp4': AssetType.VIDEO,
      'video/webm': AssetType.VIDEO,
      'video/quicktime': AssetType.VIDEO,
      'application/zip': AssetType.COMPONENT,
      'application/json': AssetType.COMPONENT,
      'text/javascript': AssetType.COMPONENT,
      'text/html': AssetType.COMPONENT,
      'text/css': AssetType.COMPONENT,
    };

    return typeMap[mimetype] || null;
  }

  async cleanupTempFiles(maxAge: number = 24 * 60 * 60 * 1000): Promise<number> {
    try {
      const tempDir = path.join(this.uploadPath, 'temp');
      const files = await fs.readdir(tempDir);
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);

        if (Date.now() - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Cleanup temp files error:', error);
      return 0;
    }
  }
}