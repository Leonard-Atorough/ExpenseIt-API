import { Router } from "express";
import { userController } from "../controllers/userController.ts";
import { authenticationHandler } from "../middleware/auth.middleware.ts";
import type { PrismaClient } from "@prisma/client";

export default function userRouter(prisma: PrismaClient) {
  const userRouter = Router();
    const { getProfile, updateProfile, deleteUser } = userController(prisma);

    userRouter.get("/profile", authenticationHandler, getProfile);

    userRouter.put("/profile", authenticationHandler, updateProfile);

    userRouter.delete("/profile", authenticationHandler, deleteUser);

    return userRouter as Router;
}