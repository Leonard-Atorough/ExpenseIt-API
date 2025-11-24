export interface RefreshToken {
  id: number;
  userId: number;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
  ip?: string;
  userAgent?: string;
}
