import { Router } from "express";
import { userController } from "../../controllers/userController.ts";
import { authenticationHandler } from "../middleware/auth.middleware.ts";
import type { PrismaClient } from "@prisma/client";
import validationHandler from "../middleware/validation.middleware.ts";
import { UpdateUserSchema } from "@src/application/dtos/authentication";

export default function createUserRouter(prisma: PrismaClient) {
  const userRouter = Router();
  const { getProfile, updateProfile, deleteUser } = userController(prisma);

  userRouter.get("/profile", authenticationHandler, getProfile);

  userRouter.put(
    "/profile",
    authenticationHandler,
    validationHandler(UpdateUserSchema),
    updateProfile,
  );

  userRouter.delete("/profile", authenticationHandler, deleteUser);

  return userRouter as Router;
}
