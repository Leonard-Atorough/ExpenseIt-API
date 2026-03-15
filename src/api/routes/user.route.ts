import { Router } from "express";
import { userController } from "../../controllers/userController.ts";
import type { PrismaClient } from "@prisma/client";
import { validationHandler, authenticationHandler, rateHandler } from "../middleware/index.js";
import { UpdateUserSchema } from "@src/application/dtos/authentication";

export default function createUserRouter(prisma: PrismaClient) {
  const userRouter = Router();
  const { getProfile, updateProfile, deleteUser } = userController(prisma);

  const rateLimit = rateHandler(25, 15 * 60 * 1000);

  userRouter.use(rateLimit);

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
