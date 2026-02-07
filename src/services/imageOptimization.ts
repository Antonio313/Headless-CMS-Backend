import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

export interface ImageSizes {
  original: string;
  large: string;
  medium: string;
  thumbnail: string;
}

/**
 * Optimize and resize uploaded image
 * Creates multiple sizes: original, 800px, 400px, 200px
 */
export const optimizeImage = async (filename: string): Promise<ImageSizes> => {
  const filePath = path.join(UPLOAD_DIR, filename);
  const ext = path.extname(filename);
  const nameWithoutExt = path.basename(filename, ext);

  const sizes: ImageSizes = {
    original: filename,
    large: `${nameWithoutExt}-large.webp`,
    medium: `${nameWithoutExt}-medium.webp`,
    thumbnail: `${nameWithoutExt}-thumb.webp`
  };

  try {
    // Large (800px)
    await sharp(filePath)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(path.join(UPLOAD_DIR, sizes.large));

    // Medium (400px)
    await sharp(filePath)
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(UPLOAD_DIR, sizes.medium));

    // Thumbnail (200px)
    await sharp(filePath)
      .resize(200, 200, { fit: 'cover' })
      .webp({ quality: 75 })
      .toFile(path.join(UPLOAD_DIR, sizes.thumbnail));

    return sizes;
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw new Error('Failed to optimize image');
  }
};

/**
 * Delete image and all its sizes
 */
export const deleteImage = async (filename: string): Promise<void> => {
  const ext = path.extname(filename);
  const nameWithoutExt = path.basename(filename, ext);

  const files = [
    filename,
    `${nameWithoutExt}-large.webp`,
    `${nameWithoutExt}-medium.webp`,
    `${nameWithoutExt}-thumb.webp`
  ];

  for (const file of files) {
    const filePath = path.join(UPLOAD_DIR, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};
