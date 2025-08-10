import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { Response } from 'express'
import { ZodSerializerDto } from 'nestjs-zod'
import path from 'path'
import { PresignedUploadFileBodyDTO, PresignedUploadFileResDTO, UploadFileResDTO } from 'src/routes/media/media.dto'
import { MediaService } from 'src/routes/media/media.service'
import { ParseFilePipeUnlink } from 'src/routes/media/parse-file-pipe-unlink.pipe'
import { UPLOAD_DIR } from 'src/shared/constants/other.constants'
import { IsPublic } from 'src/shared/decorators/auth.decorator'

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}
  @Post('images/upload')
  @ZodSerializerDto(UploadFileResDTO)
  @UseInterceptors(
    FilesInterceptor('files', 100, {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  // Client → Server → S3
  uploadFiles(
    @UploadedFiles(
      new ParseFilePipeUnlink({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/, skipMagicNumbersValidation: true }),
        ],
      }),
    )
    files: Array<Express.Multer.File>,
  ) {
    return this.mediaService.uploadFiles(files)
  }

  @Post('images/upload/presigned-url')
  @IsPublic()
  @ZodSerializerDto(PresignedUploadFileResDTO)
  // Client → Server để lấy presigned URL -> Client → S3 bằng presigned URL
  async createPresignedUrl(@Body() body: PresignedUploadFileBodyDTO) {
    return this.mediaService.getPresignedUrl(body)
  }

  @Get('static/:filename')
  @IsPublic()
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    res.sendFile(path.resolve(UPLOAD_DIR, filename), (error) => {
      const NotFound = new NotFoundException('File not found')
      if (error) {
        res.status(NotFound.getStatus()).json(NotFound.getResponse())
      }
    })
  }
}
