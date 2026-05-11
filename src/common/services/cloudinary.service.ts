import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { v2 as cloudinary } from 'cloudinary'
import envConfig from '@/common/utils/config'
import { UploadedFileData } from '@/common/types/uploaded-file.type'

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: envConfig.CLOUDINARY_CLOUD_NAME,
      api_key: envConfig.CLOUDINARY_API_KEY,
      api_secret: envConfig.CLOUDINARY_API_SECRET,
    })
  }
  async uploadImage(file: UploadedFileData, folder = envConfig.CLOUDINARY_VIDEO_TOPIC_FOLDER) {
    try {
      const base64Data = file.buffer.toString('base64')
      const dataURI = `data:${file.mimetype};base64,${base64Data}`

      const result = await cloudinary.uploader.upload(dataURI, {
        folder,
        resource_type: 'image',
        public_id: file.originalname.split('.')[0], // Optional: set public_id
      })

      return result.secure_url
    } catch (error) {
      console.error('Cloudinary upload failed:', error)
      throw new InternalServerErrorException('Error.UploadImageFailed')
    }
  }

  async deleteResourceByUrl(url: string, resourceType: 'image' | 'video' | 'auto' = 'image') {
    try {
      // Example Cloudinary URL structure:
      // https://res.cloudinary.com/<cloud_name>/<asset_type>/upload/v<version>/<folder>/<public_id>.<ext>
      const uploadIndex = url.indexOf('/upload/')
      if (uploadIndex === -1) return

      let publicPath = url.substring(uploadIndex + '/upload/'.length)
      // Remove version prefix if present: v123456789/
      publicPath = publicPath.replace(/^v\d+\//, '')
      // Remove file extension
      publicPath = publicPath.replace(/\.[a-zA-Z0-9]+$/, '')

      await cloudinary.uploader.destroy(publicPath, { resource_type: resourceType })
    } catch (error) {
      console.error('Cloudinary delete failed:', error)
      // swallow error to avoid failing caller; deletion is best-effort
    }
  }

  async uploadAudio(file: UploadedFileData, folder = envConfig.CLOUDINARY_SHADOWING_AUDIO_FOLDER) {
    try {
      const base64Data = file.buffer.toString('base64')
      const dataURI = `data:${file.mimetype};base64,${base64Data}`

      const result = await cloudinary.uploader.upload(dataURI, {
        folder,
        resource_type: 'video',
        public_id: file.originalname.split('.')[0], // Optional: set public_id
      })

      return result.secure_url
    } catch (error) {
      console.error('Cloudinary upload failed:', error)
      throw new InternalServerErrorException('Error.UploadAudioFailed')
    }
  }
}
