import { PermissionSchema } from 'src/shared/models/shared-permission.model'
import z from 'zod'

export const RoleSchema = z.object({
  id: z.number(),
  name: z.string().max(500),
  description: z.string(),
  isActive: z.boolean().default(true),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedById: z.number().nullable(),
  deletedAt: z.date().nullable(),
  updatedAt: z.date(),
  createdAt: z.date(),
})

export const RolePermissionSchema = RoleSchema.extend({
  permissions: z.array(PermissionSchema),
})

export type RoleType = z.infer<typeof RoleSchema>
export type RolePermissionType = z.infer<typeof RolePermissionSchema>
