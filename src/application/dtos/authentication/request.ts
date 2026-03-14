import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

export const LoginUserSchema = z.object({
  email: z.email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.email().optional(),
  profilePicture: z.string().optional(),
  profileName: z.string().optional(),
});

export const RefreshTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// Inferred types for use throughout the app
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type LoginUserDto = z.infer<typeof LoginUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
