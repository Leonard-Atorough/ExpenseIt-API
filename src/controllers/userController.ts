import type { PrismaClient } from "@prisma/client";
import type { Request, Response, NextFunction } from "express";

export function userController(prisma: PrismaClient) {
  async function getProfile(req: Request, res: Response, next: NextFunction) {
    res.send("Hello from user controller - getProfile");
  }
  async function updateProfile(req: Request, res: Response, next: NextFunction) {
    res.send("Hello from user controller - updateProfile");
  }

  async function deleteUser(req: Request, res: Response, next: NextFunction) {
    res.send("Hello from user controller - deleteUser");
  }

  return { getProfile, updateProfile, deleteUser };
}
