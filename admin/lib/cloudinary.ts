import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  resource_type: 'image' | 'video'
  bytes: number
  created_at: string
}

/**
 * Upload file to Cloudinary with LO2S-specific transformations
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = 'lo2s'
): Promise<CloudinaryUploadResult> {
  try {
    // Convert File to base64 for upload
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64, {
      folder,
      resource_type: file.type.startsWith('video') ? 'video' : 'image',
      // Generate responsive versions for images
      ...(file.type.startsWith('image') && {
        eager: [
          { width: 128, height: 128, crop: 'fill', format: 'webp', quality: 'auto' },
          { width: 256, height: 256, crop: 'fill', format: 'webp', quality: 'auto' },
          { width: 640, height: 640, crop: 'fill', format: 'webp', quality: 'auto' },
          { width: 768, height: 768, crop: 'fill', format: 'webp', quality: 'auto' },
          { width: 1080, height: 1080, crop: 'fill', format: 'webp', quality: 'auto' },
          { width: 1920, height: 1920, crop: 'fill', format: 'webp', quality: 'auto' },
          { width: 2880, height: 2880, crop: 'fill', format: 'webp', quality: 'auto' },
          { width: 3072, height: 3072, crop: 'fill', format: 'webp', quality: 'auto' },
        ]
      }),
      // Video optimizations
      ...(file.type.startsWith('video') && {
        eager: [
          { 
            streaming_profile: 'hd',
            format: 'mp4',
            quality: 'auto',
            width: 1080,
            height: 1080,
            crop: 'limit'
          }
        ]
      })
    })

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type as 'image' | 'video',
      bytes: result.bytes,
      created_at: result.created_at
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error('Failed to upload to Cloudinary')
  }
}

/**
 * Generate responsive image URLs for different screen sizes
 */
export function generateResponsiveUrls(cloudinaryUrl: string) {
  const baseUrl = cloudinaryUrl.split('/upload/')[0] + '/upload/'
  const imagePath = cloudinaryUrl.split('/upload/')[1]
  
  return {
    x128: `${baseUrl}c_fill,w_128,h_128,q_auto,f_webp/${imagePath}`,
    x256: `${baseUrl}c_fill,w_256,h_256,q_auto,f_webp/${imagePath}`,
    x640: `${baseUrl}c_fill,w_640,h_640,q_auto,f_webp/${imagePath}`,
    x768: `${baseUrl}c_fill,w_768,h_768,q_auto,f_webp/${imagePath}`,
    x1080: `${baseUrl}c_fill,w_1080,h_1080,q_auto,f_webp/${imagePath}`,
    x1920: `${baseUrl}c_fill,w_1920,h_1920,q_auto,f_webp/${imagePath}`,
    x2880: `${baseUrl}c_fill,w_2880,h_2880,q_auto,f_webp/${imagePath}`,
    x3072: `${baseUrl}c_fill,w_3072,h_3072,q_auto,f_webp/${imagePath}`,
    default: cloudinaryUrl
  }
}

/**
 * Generate video thumbnail from Cloudinary video
 */
export function generateVideoThumbnail(videoUrl: string, width = 640, height = 360) {
  const baseUrl = videoUrl.split('/upload/')[0] + '/upload/'
  const videoPath = videoUrl.split('/upload/')[1]
  
  return `${baseUrl}c_thumb,w_${width},h_${height},q_auto,f_webp/${videoPath}`
}

export default cloudinary
