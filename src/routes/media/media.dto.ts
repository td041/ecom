import { createZodDto } from 'nestjs-zod'
import { PresignedUploadFileBodySchema, PresignedUploadFileResSchema, UploadFileResSchema } from 'src/routes/media/media.model';

export class PresignedUploadFileBodyDTO extends createZodDto(PresignedUploadFileBodySchema) {}
export class UploadFileResDTO extends createZodDto(UploadFileResSchema) {}
export class PresignedUploadFileResDTO extends createZodDto(PresignedUploadFileResSchema) {}