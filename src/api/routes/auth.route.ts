import { Router } from "express";
import { AuthenticationController } from "../controllers";
import type { PrismaClient } from "@prisma/client";
import { AuthenticationService } from "@src/application/services/authentication.service";
import { TokenRepository, UserRepository } from "@src/infrastructure/repositories";
import { authenticationHandler } from "../middleware/auth.middleware";

export default function createAuthRouter(prisma: PrismaClient) {
  const authRouter = Router();

  const authenticationController = new AuthenticationController(
    new AuthenticationService(new UserRepository(prisma), new TokenRepository(prisma)),
  );

  authRouter.get("/", (req, res) => {
    res.status(200).json({ message: "Auth route is working" });
  });

  authRouter.get(
    "/me",
    authenticationHandler,
    authenticationController.GetCurrentUser.bind(authenticationController),
  );

  authRouter.post("/register", authenticationController.Register.bind(authenticationController));

  authRouter.post("/refresh", authenticationController.Refresh.bind(authenticationController));

  authRouter.post("/login", authenticationController.Login.bind(authenticationController));

  authRouter.post("/logout", authenticationController.Logout.bind(authenticationController));

  /**
   * This endpoint is for testing purposes only. It allows us to generate a token for a user without going through the login process.
   * In production, this should be removed or protected with additional authentication.
   */
  authRouter.post("/token", authenticationController.GenerateToken.bind(authenticationController));

  return authRouter as Router;
}
