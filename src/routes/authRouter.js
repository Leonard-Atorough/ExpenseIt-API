import { Router } from "express";
import { authController } from "../controllers/authController.js";

export default function authRouter(prisma) {
  const authRouter = Router();

  const { register, login, refresh, logout } = authController(prisma);

  authRouter.get("/", (req, res) => {
    res.status(200).json({ message: "Auth route is working" });
  });

  authRouter.post("/register", register);

  authRouter.post("/refresh", refresh);

  authRouter.post("/login", login);

  authRouter.post("/logout", logout);

  return authRouter;
}
