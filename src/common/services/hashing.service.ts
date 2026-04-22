import { Injectable } from '@nestjs/common'
import { compare, hash } from 'bcrypt'

const SALT_ROUNDS = 10
@Injectable()
export class HashingService {
  hash(value: string) {
    return hash(value, SALT_ROUNDS)
  }

  compare(value: string, hashedValue: string) {
    return compare(value, hashedValue)
  }
}
