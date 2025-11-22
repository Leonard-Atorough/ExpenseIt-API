import jwt from "jsonwebtoken";

// export function generateJwt(payload, secret, expiresIn) {
//   // Implementation for generating JWT token using the provided payload, secret, and expiry
//   const token = jwt.sign(payload, secret, { expiresIn });
//     return token;
// }

export async function verifyJwt(token, secret) {
  // Implementation for verifying JWT token using the provided secret
  const payload = jwt.verify(token, secret);
  return payload;
}
