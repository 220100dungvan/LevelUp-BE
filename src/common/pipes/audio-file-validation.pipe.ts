import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import type { UploadedFileData } from '@/common/types/uploaded-file.type'

const AUDIO_MIME_TYPE_REGEX = /^(audio|video)\/(webm|ogg|wav|mpeg|mp4|m4a|mp3|flac)(;.*)?$/

@Injectable()
export class AudioFileValidationPipe implements PipeTransform {
  constructor(private readonly isRequired = true) {}

  transform(value: UploadedFileData | undefined, _metadata: ArgumentMetadata) {
    if (!value) {
      if (this.isRequired) {
        throw new BadRequestException('Error.AudioRequired')
      }
      return value
    }

    if (!AUDIO_MIME_TYPE_REGEX.test(value.mimetype)) {
      throw new BadRequestException('Error.InvalidAudioFormat')
    }

    return value
  }
}

export const requiredAudioFileValidationPipe = new AudioFileValidationPipe(true)
export const optionalAudioFileValidationPipe = new AudioFileValidationPipe(false)
