import type { PublicKeyInput, JsonWebKeyInput } from "crypto";
import jwt, { type JwtPayload, type VerifyOptions } from "jsonwebtoken";

export interface AccessTokenPayload extends JwtPayload {
  sub: string; // userId
  iat?: number;
  exp?: number;
}

export async function signJwt(
  payload: object,
  secret: string | Buffer | JsonWebKeyInput,
  options?: jwt.SignOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, secret, options, (err, token) => {
      if (err || !token) {
        return reject(err);
      }
      resolve(token);
    });
  });
}

export async function verifyJwt(
  token: string,
  secret: string | Buffer | PublicKeyInput | JsonWebKeyInput,
  options?: VerifyOptions
): Promise<AccessTokenPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, options, (err, payload) => {
      if (err || !payload) {
        return reject(err);
      }
      resolve(payload as AccessTokenPayload);
    });
  });
}
