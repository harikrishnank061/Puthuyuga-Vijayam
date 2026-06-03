import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Uploads a base64 image string directly to Cloudinary.
 * Automatically converts the image to WebP, limits width/height to 1200px, 
 * and applies automatic quality compression (q_auto) to keep file sizes under ~100KB.
 */
export async function uploadImageToCloudinary(base64Image: string, folder = 'fix-my-street'): Promise<string> {
  if (!base64Image) {
    throw new Error('Image content is missing');
  }

  // Ensure base64 string starts with correct data URL prefix if not already present
  const uploadContent = base64Image.startsWith('data:image/')
    ? base64Image
    : `data:image/jpeg;base64,${base64Image}`;

  try {
    const uploadResponse = await cloudinary.uploader.upload(uploadContent, {
      folder: folder,
      format: 'webp', // Convert automatically to highly optimized WebP format
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' }, // Constrain bounds to prevent giant files
        { quality: 'auto' }, // Automatically compress to the best visual quality / file size ratio
      ],
    });

    return uploadResponse.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw new Error('Failed to upload and optimize image');
  }
}
