import { Router } from "express";
import { AuthenticationController } from "../controllers";
import type { PrismaClient } from "@prisma/client";
import { AuthenticationService } from "@src/application/services/authentication.service";
import { TokenRepository, UserRepository } from "@src/infrastructure/repositories";
import { authenticationHandler, validationHandler } from "../middleware/index.js";
import {
  CreateUserSchema,
  LoginUserSchema,
  RefreshTokenSchema,
} from "@src/application/dtos/authentication";

export default function createAuthRouter(prisma: PrismaClient) {
  const authRouter = Router();

  const authenticationController = new AuthenticationController(
    new AuthenticationService(new UserRepository(prisma), new TokenRepository(prisma)),
  );

  authRouter.get(
    "/me",
    authenticationHandler,
    authenticationController.GetCurrentUser.bind(authenticationController),
  );

  authRouter.post(
    "/register",
    validationHandler(CreateUserSchema),
    authenticationController.Register.bind(authenticationController),
  );

  authRouter.post(
    "/refresh",
    validationHandler(RefreshTokenSchema),
    authenticationController.Refresh.bind(authenticationController),
  );

  authRouter.post(
    "/login",
    validationHandler(LoginUserSchema),
    authenticationController.Login.bind(authenticationController),
  );

  authRouter.post("/logout", authenticationController.Logout.bind(authenticationController));

  /**
   * This endpoint is for testing purposes only. It allows us to generate a token for a user without going through the login process.
   * In production, this should be removed or protected with additional authentication.
   */
  authRouter.post("/token", authenticationController.GenerateToken.bind(authenticationController));

  return authRouter as Router;
}
