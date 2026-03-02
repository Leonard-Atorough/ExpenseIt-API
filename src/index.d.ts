import type { JwtPayload } from "jsonwebtoken";
import type { AccessTokenPayload } from "./api/utils/jwtUtils";

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export {};
