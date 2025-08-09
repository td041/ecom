import { ParseFilePipe, ParseFileOptions } from '@nestjs/common'
import { unlink } from 'fs/promises'

export class ParseFilePipeUnlink extends ParseFilePipe {
  constructor(options: ParseFileOptions) {
    super(options)
  }
  

  async transform(files: Array<Express.Multer.File>): Promise<any> {
    await super.transform(files).catch(async (error) => {
      await Promise.all(files.map((file) => unlink(file.path)))
      console.log('File validation error:', error)
      throw error
    })
  }
}
