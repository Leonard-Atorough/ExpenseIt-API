import type { PublicKeyInput, JsonWebKeyInput } from "crypto";
import jwt from "jsonwebtoken";

// export function generateJwt(payload, secret, expiresIn) {
//   // Implementation for generating JWT token using the provided payload, secret, and expiry
//   const token = jwt.sign(payload, secret, { expiresIn });
//     return token;
// }

export async function verifyJwt(
  token: string,
  secret: string | Buffer | PublicKeyInput | JsonWebKeyInput
): Promise<jwt.JwtPayload> {
  const payload = jwt.verify(token, secret);
  return payload as jwt.JwtPayload;
}
