import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import type { UploadedFileData } from '@/common/types/uploaded-file.type'

const IMAGE_MIME_TYPE_REGEX = /^(image\/(jpeg|jpg|png|webp))$/

@Injectable()
export class ImageFileValidationPipe implements PipeTransform {
  constructor(private readonly isRequired = true) {}

  transform(value: UploadedFileData | undefined, _metadata: ArgumentMetadata) {
    if (!value) {
      if (this.isRequired) {
        throw new BadRequestException('thumbnail is required')
      }
      return value
    }

    if (!IMAGE_MIME_TYPE_REGEX.test(value.mimetype)) {
      throw new BadRequestException('Only jpeg, jpg, png, webp images are allowed')
    }

    return value
  }
}

export const requiredImageFileValidationPipe = new ImageFileValidationPipe(true)
export const optionalImageFileValidationPipe = new ImageFileValidationPipe(false)
