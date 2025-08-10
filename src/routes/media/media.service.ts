import { Injectable } from '@nestjs/common'
import { S3Service } from 'src/shared/services/s3.service'
import { unlink } from 'fs/promises'
import { generateRandomFileName } from 'src/shared/helpers'
import { PresignedUploadFileBodyType } from 'src/routes/media/media.model'

@Injectable()
export class MediaService {
  constructor(private readonly s3Service: S3Service) {}
  // Client → Server → S3
  async uploadFiles(files: Array<Express.Multer.File>) {
    const result = await Promise.all(
      files.map((file) => {
        return this.s3Service
          .uploadFile({
            filename: 'images/' + file.filename,
            filepath: file.path,
            contentType: file.mimetype,
          })
          .then((res) => {
            return { url: res.Location }
          })
      }),
    )
    // Xóa file tạm sau khi upload lên S3
    await Promise.all(files.map((file) => unlink(file.path)))
    return { data: result }
  }
  // Client → Server để lấy presigned URL -> Client → S3 bằng presigned URL
  async getPresignedUrl(body: PresignedUploadFileBodyType) {
    const randomFileName = generateRandomFileName(body.filename)
    const presignedUrl = await this.s3Service.createPresignedUrlWithClient(randomFileName)
    const url = presignedUrl.split('?')[0]
    return {
      presignedUrl,
      url,
    }
  }
}
