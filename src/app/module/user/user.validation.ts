import { z } from "zod";
import { UserRole, UserStatus } from "../../../../generated/prisma/enums";

export const userListQuerySchema = z.object({
  search: z.string().trim().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
