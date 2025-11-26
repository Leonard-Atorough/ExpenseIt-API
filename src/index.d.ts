import type { JwtPayload } from "jsonwebtoken";
import type { AccessTokenPayload } from "./utils/jwtUtils";

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export {};
