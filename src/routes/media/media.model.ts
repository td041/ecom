import { z } from 'zod'

export const PresignedUploadFileBodySchema = z
  .object({
    filename: z.string(),
    filesize: z.number().max(5 * 1024 * 1024),
  })
  .strict()
export const UploadFileResSchema = z.object({
  data: z.array(
    z.object({
      url: z.string(),
    }),
  ),
})

export const PresignedUploadFileResSchema = z.object({
  url: z.string(),
  presignedUrl: z.string(),
})

export type PresignedUploadFileBodyType = z.infer<typeof PresignedUploadFileBodySchema>
export type UploadFileResType = z.infer<typeof UploadFileResSchema>
export type PresignedUploadFileResType = z.infer<typeof PresignedUploadFileResSchema>
