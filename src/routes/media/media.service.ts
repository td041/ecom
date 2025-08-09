import { Injectable } from '@nestjs/common'
import { S3Service } from 'src/shared/services/s3.service'
import { unlink } from 'fs/promises'

@Injectable()
export class MediaService {
  constructor(private readonly s3Service: S3Service) {}
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
    return result
  }
}
