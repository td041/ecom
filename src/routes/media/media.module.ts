import { Module } from '@nestjs/common'
import { MulterModule } from '@nestjs/platform-express'
import { existsSync, mkdirSync } from 'fs'
import multer from 'multer'
import { MediaController } from 'src/routes/media/media.controller'
import { MediaService } from 'src/routes/media/media.service'
import { UPLOAD_DIR } from 'src/shared/constants/other.constants'
import { generateRandomFileName } from 'src/shared/helpers'

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR)
  },
  filename: function (req, file, cb) {
    const newFileName = generateRandomFileName(file.originalname)
    cb(null, newFileName)
  },
})

@Module({
  imports: [
    MulterModule.register({
      storage: storage,
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {
  constructor() {
    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true })
    }
  }
}
