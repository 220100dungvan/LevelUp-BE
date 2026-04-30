import envConfig from '@/common/utils/config'
import { createCipheriv, randomBytes } from 'crypto'

export function encryptData(plainText: string): { encryptedData: string; iv: string } {
  const key = Buffer.from(envConfig.ENCRYPTION_KEY, 'utf8')
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-cbc', key, iv)
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  return {
    encryptedData: encrypted.toString('base64'),
    iv: iv.toString('hex'),
  }
}
