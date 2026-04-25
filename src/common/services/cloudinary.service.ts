import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { createHash } from 'crypto'
import envConfig from '@/common/utils/config'
import { UploadedImageFile } from '@/common/types/uploaded-file.type'

@Injectable()
export class CloudinaryService {
  async uploadImage(file: UploadedImageFile, folder = envConfig.CLOUDINARY_VIDEO_TOPIC_FOLDER) {
    try {
      const timestamp = Math.floor(Date.now() / 1000)
      const paramsToSign = `folder=${folder}&timestamp=${timestamp}`
      const signature = createHash('sha1').update(`${paramsToSign}${envConfig.CLOUDINARY_API_SECRET}`).digest('hex')

      const body = new FormData()
      const bytes = new Uint8Array(file.buffer)
      body.append('file', new Blob([bytes], { type: file.mimetype }), file.originalname)
      body.append('api_key', envConfig.CLOUDINARY_API_KEY)
      body.append('timestamp', String(timestamp))
      body.append('folder', folder)
      body.append('signature', signature)

      const response = await fetch(`https://api.cloudinary.com/v1_1/${envConfig.CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body,
      })

      if (!response.ok) {
        throw new Error('Upload image failed')
      }

      const payload = (await response.json()) as { secure_url?: string }
      if (!payload.secure_url) {
        throw new Error('Missing secure_url')
      }

      return payload.secure_url
    } catch (error) {
      console.error('Cloudinary upload failed:', error)
      throw new InternalServerErrorException('Error.UploadImageFailed')
    }
  }
}
