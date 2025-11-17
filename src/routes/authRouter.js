import { Router } from "express";

const authRouter = Router();

authRouter.get("/", (req, res) => res.send("welcome to the auth router"));

authRouter.post("/register", (req, res) => res.send("Register route called"));

authRouter.post("/login", (req, res) => res.send("Login route called"));

export { authRouter };
