import type { PrismaClient } from "@prisma/client";
import type { ITokenRepository } from "src/core/interfaces";

export class TokenRepository implements ITokenRepository {
  private client: PrismaClient;

  constructor(client: PrismaClient) {
    this.client = client;
  }

  async saveRefreshToken(
    userId: string,
    refreshTokenId: string,
    createdAt: Date,
    expiresAt: Date,
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    // Delete any existing token for this user (unique constraint allows only one per user)
    await this.client.refreshToken.deleteMany({
      where: { userId },
    });

    // Create the new refresh token
    await this.client.refreshToken.create({
      data: {
        id: refreshTokenId,
        userId,
        createdAt,
        expiresAt,
        ip: ip ?? null,
        userAgent: userAgent ?? null,
        revokedAt: null,
      },
    });
  }

  async revokeRefreshToken(refreshTokenId: string): Promise<void> {
    await this.client.refreshToken.update({
      where: { id: refreshTokenId },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async findTokenRecordById(refreshTokenId: string): Promise<{
    userId: string;
    rid: string;
    createdAt: Date;
    expiresAt: Date;
    revokedAt: Date | null;
    ip?: string;
    userAgent?: string;
  } | null> {
    const tokenRecord = await this.client.refreshToken.findUnique({
      where: { id: refreshTokenId },
    });

    if (!tokenRecord) {
      return null;
    }

    return {
      userId: tokenRecord.userId,
      rid: tokenRecord.id,
      createdAt: tokenRecord.createdAt,
      expiresAt: tokenRecord.expiresAt,
      revokedAt: tokenRecord.revokedAt,
      ip: tokenRecord.ip ?? undefined,
      userAgent: tokenRecord.userAgent ?? undefined,
    };
  }
}
