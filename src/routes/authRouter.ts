import { Router } from "express";
import { authController } from "../controllers/authController.js";
import type { PrismaClient } from "@prisma/client";

export default function authRouter(prisma: PrismaClient) {
  const authRouter = Router();

  const { register, verify, login, refresh, logout } = authController(prisma);

  authRouter.get("/", (req, res) => {
    res.status(200).json({ message: "Auth route is working" });
  });

  authRouter.post("/register", register);

  authRouter.get("/verify", verify);

  authRouter.post("/refresh", refresh);

  authRouter.post("/login", login);

  authRouter.post("/logout", logout);

  return authRouter as Router;
}
