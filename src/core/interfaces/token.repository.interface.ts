export interface ITokenRepository {
  saveRefreshToken(
    userId: string,
    refreshTokenId: string,
    createdAt: Date,
    expiresAt: Date,
    ip?: string,
    userAgent?: string,
  ): Promise<void>;
  revokeRefreshToken(refreshTokenId: string): Promise<void>;
  findTokenRecordById(refreshTokenId: string): Promise<{
    userId: string;
    rid: string;
    createdAt: Date;
    expiresAt: Date;
    revokedAt: Date | null;
    ip?: string;
    userAgent?: string;
  } | null>;
}
