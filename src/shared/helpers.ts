import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { randomInt } from 'crypto'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export function isUniqueConstraintPrismaError(error: any): error is PrismaClientKnownRequestError {
  return error instanceof PrismaClientKnownRequestError && error.code === 'P2002'
}
export function isNotFoundPrismaError(error: any): error is PrismaClientKnownRequestError {
  return error instanceof PrismaClientKnownRequestError && error.code === 'P2025'
}
export function isForeignKeyConstraintPrismaError(error: any): error is PrismaClientKnownRequestError {
  return error instanceof PrismaClientKnownRequestError && error.code === 'P2003'
}
export function generateOTP() {
  return String(randomInt(100000, 1000000))
}

export const generateRandomFileName = (fileName: string) => {
  const ext = path.extname(fileName)
  return `${uuidv4()}${ext}`
}
