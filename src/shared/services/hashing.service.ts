import { Injectable } from '@nestjs/common'
import { compare, hash } from 'bcrypt'

const saleRounds = 10

@Injectable()
export class HashingService {
  hash(value: string) {
    return hash(value, saleRounds)
  }
  compare(value: string, hash: string) {
    return compare(value, hash)
  }
}
