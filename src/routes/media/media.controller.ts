import {
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  Post,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { Response } from 'express'
import path from 'path'
import envConfig from 'src/shared/config'
import { UPLOAD_DIR } from 'src/shared/constants/other.constants'
import { IsPublic } from 'src/shared/decorators/auth.decorator'

@Controller('media')
export class MediaController {
  @Post('images/upload')
  @UseInterceptors(
    FilesInterceptor('files', 100, {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  uploadFiles(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/, skipMagicNumbersValidation: true }),
        ],
      }),
    )
    files: Array<Express.Multer.File>,
  ) {
    return {
      url: files.map((file) => {
        return `${envConfig.PREFIX_STATIC_ENDPOINT}/${file.filename}`
      }),
    }
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
