import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { parseExpiryToMs } from "../utils/timeUtils.js";
import "dotenv/config";

export function authService(prisma) {
  const saltRounds = 10;

  async function register(params) {
    const { firstName, email, password } = params;
    let { lastName } = params;

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    lastName = lastName ?? null;
    const user = await prisma.user.create({
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
  async function login({ email, password, ip = "", userAgent = "" }) {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
      include: { account: true },
    });

    if (!user || !user.account) return { ok: false, code: 401, message: "Authentication failed" };

    const passwordMatch = await bcrypt.compare(password, user.account.password);

    if (!passwordMatch) return { ok: false, code: 401, message: "Authentication failed" };

    //create and persist tokens
    const { token, refreshToken, refreshId } = IssueTokens(user.id);

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
    return { ok: true, code: 200, data: { user: sanitized, token, refreshToken } };
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

  async function refresh(params) {
    const { rawRefresh } = params;
    const payload = jwt.verify(rawRefresh, process.env.JWT_REFRESH_SECRET);

    const { sub, rid } = payload;

    // get the record from the DB
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
    const { token, refreshToken, refreshId } = IssueTokens(sub);
    // persist the new refresh token and revoke the old one
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
  }

  /**
   *
   * @param {string} userId
   * @returns {Object} tokens
   * @returns {string} tokens.token
   * @returns {string} tokens.refreshToken
   * @returns {string} tokens.refreshId
   */
  function IssueTokens(userId) {
    const token = jwt.sign({ sub: String(userId) }, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXP || "15m",
    });
    const refreshId = crypto.randomUUID();
    const refreshToken = jwt.sign({ sub: userId, rid: refreshId }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXP || "7d",
    });
    return { token, refreshToken, refreshId };
  }
  return { register, login, refresh };
}
