import type { PublicKeyInput, JsonWebKeyInput } from "crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";

export interface AccessTokenPayload extends JwtPayload {
  sub: string; // userId
  iat?: number;
  exp?: number;
}

// export function generateJwt(payload, secret, expiresIn) {
//   // Implementation for generating JWT token using the provided payload, secret, and expiry
//   const token = jwt.sign(payload, secret, { expiresIn });
//     return token;
// }

export async function verifyJwt(
  token: string,
  secret: string | Buffer | PublicKeyInput | JsonWebKeyInput
): Promise<AccessTokenPayload> {
  const payload = jwt.verify(token, secret);

  if (typeof payload === "string") {
    throw new Error("Invalid token payload");
  }

  if (!payload.sub) {
    throw new Error("Token payload missing 'sub' field");
  }

  return payload as AccessTokenPayload;
}
