import jwt, { type JwtPayload } from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { parseExpiryToMs } from "../utils/timeUtils.ts";
import { type AccessTokenPayload, signJwt } from "../utils/jwtUtils.ts";
import "dotenv/config";
import type { PrismaClient } from "@prisma/client";

interface JwtPayloadWithRid extends JwtPayload {
  rid: string;
}

export function authService(prisma: PrismaClient) {
  const saltRounds = 10;
  // Use a discriminated union for clearer consumer inference.
  async function register(params: {
    firstName: string;
    lastName?: string;
    email: string;
    password: string;
  }): Promise<
    | {
        ok: true;
        code: 201;
        data: { id: string; firstName: string; lastName: string | null; email: string };
      }
    | {
        ok: false;
        code: 400 | 409 | 500;
        message: string;
        internal?: string;
      }
  > {
    const { firstName, email, password } = params;
    let { lastName } = params;

    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return { ok: false, code: 409, message: "Email already in use" };
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    lastName = lastName ?? null;

    let user;

    try {
      user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          account: {
            create: {
              password: hashedPassword,
            },
          },
        },
        select: { id: true, firstName: true, lastName: true, email: true },
      });
      return { ok: true, code: 201, data: user };
    } catch (error) {
      return { ok: false, code: 500, message: "Failed to register user", internal: String(error) };
    }
  }

  /**
   * @param {Object} login
   * @param {string} login.email
   * @param {string} login.password
   * @param {string} login.ip
   * @param {string} login.userAgent
   *
   * @returns {Object} result
   * @returns {boolean} result.ok
   * @returns {number} result.code
   * @returns {string} [result.message]
   * @returns {Object} [result.data]
   * @returns {Object} result.data.user
   * @returns {string} result.data.token
   * @returns {string} result.data.refreshToken
   */
  async function login({
    email,
    password,
    ip,
    userAgent,
  }: {
    email: string;
    password: string;
    ip?: string;
    userAgent?: string;
  }): Promise<
    | {
        ok: true;
        code: 200;
        data: {
          user: { id: string; firstName: string; lastName: string | null; email: string };
          accessToken: string;
          refreshToken: string;
        };
      }
    | { ok: false; code: 401 | 500; message: string; internal?: string }
  > {
    try {
      const user = await prisma.user.findUnique({
        where: {
          email: email,
        },
        include: { account: true },
      });

      if (!user || !user.account) return { ok: false, code: 401, message: "Authentication failed" };

      const passwordMatch = await bcrypt.compare(password, user.account.password);

      if (!passwordMatch)
        return { ok: false, code: 401, message: "Authentication failed: Incorrect password" };

      //create and persist tokens
      const { token, refreshToken, refreshId } = await IssueTokens(user.id);

      const date = Date.now();
      // TODO - Consider token storage improvements like indexing by userId for easy revocation of all tokens

      await prisma.refreshToken.create({
        data: {
          id: refreshId,
          userId: user.id,
          ip: ip ?? "",
          userAgent: userAgent ?? "",
          createdAt: new Date(date),
          expiresAt: new Date(date + parseExpiryToMs(process.env.REFRESH_TOKEN_EXP)),
        },
      });

      const sanitized = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName ?? null,
        email: user.email,
      };
      return { ok: true, code: 200, data: { user: sanitized, accessToken: token, refreshToken } };
    } catch (error) {
      return { ok: false, code: 500, message: "Failed to login", internal: String(error) };
    }
  }

  /**
   *
   * @param {Object} params
   * @param {string} params.rawRefresh
   * @returns {Object} result
   * @returns {boolean} result.ok
   * @returns {number} result.code
   * @returns {string} [result.message]
   * @returns {Object} [result.data]
   * @returns {string} result.data.token
   * @returns {string} result.data.refreshToken
   */

  async function refresh(params: {
    rawRefresh: string;
  }): Promise<
    | { ok: true; code: 200; data: { token: string; refreshToken: string } }
    | { ok: false; code: 401 | 500; message: string; internal?: string }
  > {
    const { rawRefresh } = params;
    try {
      const payload = jwt.verify(rawRefresh, process.env.JWT_REFRESH_SECRET);

      const { sub, rid } = payload as JwtPayloadWithRid;

      const tokenRecord = await prisma.refreshToken.findUnique({
        where: {
          id: rid,
        },
      });

      if (!tokenRecord || tokenRecord.userId !== sub || tokenRecord.revokedAt) {
        return {
          ok: false,
          code: 401,
          message: "Invalid refresh token",
          internal: "Refresh token not found or revoked",
        };
      }
      // TODO If the validation here fails, also log them out. Pass a unified error message to avoid giving clues to attackers
      // Pass an internal message to the controller for logging and to trigger any security workflows
      if (new Date(tokenRecord.expiresAt).getTime() < Date.now()) {
        return {
          ok: false,
          code: 401,
          message: "Invalid refresh token",
          internal: "Refresh token expired",
        };
      }
      // issue new tokens - Move to a helper function later
      const { token, refreshToken, refreshId } = await IssueTokens(sub);

      const date = Date.now();
      await prisma.$transaction([
        prisma.refreshToken.create({
          data: {
            id: refreshId,
            userId: sub,
            ip: tokenRecord.ip ?? "",
            userAgent: tokenRecord.userAgent ?? "",
            createdAt: new Date(date),
            expiresAt: new Date(date + parseExpiryToMs(process.env.REFRESH_TOKEN_EXP)),
          },
        }),
        prisma.refreshToken.update({
          where: { id: rid },
          data: { revokedAt: new Date() },
        }),
      ]);
      return { ok: true, code: 200, data: { token, refreshToken } };
    } catch (err) {
      return { ok: false, code: 500, message: "Failed to refresh tokens", internal: String(err) };
    }
  }

  async function logout(params: {
    rawRefresh: string;
  }): Promise<
    | { ok: true; code: 200; message: string }
    | { ok: false; code: 400 | 500; message: string; internal?: string }
  > {
    const { rawRefresh } = params;

    try {
      const payload = jwt.verify(rawRefresh, process.env.JWT_REFRESH_SECRET) as JwtPayload;

      if (!payload || !payload.rid) {
        return {
          ok: false,
          code: 400,
          message: "Invalid refresh token",
          internal: "JWT verification failed",
        };
      }

      const { rid } = payload as JwtPayloadWithRid;

      await prisma.refreshToken.update({
        where: { id: rid },
        data: { revokedAt: new Date() },
      });
      return { ok: true, code: 200, message: "Logged out successfully" };
    } catch (err) {
      return { ok: false, code: 500, message: "Failed to logout", internal: String(err) };
    }
  }

  /**
   *
   * @param {string} userId
   * @returns {Object} tokens
   * @returns {string} tokens.token
   * @returns {string} tokens.refreshToken
   * @returns {string} tokens.refreshId
   */
  async function IssueTokens(userId: string): Promise<{
    token: string;
    refreshToken: string;
    refreshId: string;
  }> {
    const token = await signJwt(
      { sub: String(userId), exp: parseExpiryToMs(process.env.ACCESS_TOKEN_EXP || "15m") / 1000 },
      process.env.JWT_ACCESS_SECRET
    );
    const refreshId = crypto.randomUUID();
    const refreshToken = await signJwt(
      {
        sub: userId,
        rid: refreshId,
        exp: parseExpiryToMs(process.env.REFRESH_TOKEN_EXP || "7d") / 1000,
      },
      process.env.JWT_REFRESH_SECRET
    );
    return { token, refreshToken, refreshId };
  }
  return { register, login, refresh, logout };
}
