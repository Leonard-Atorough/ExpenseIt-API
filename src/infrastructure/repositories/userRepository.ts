import type { PrismaClient } from "@prisma/client";
import type { User } from "src/core/entities";
import type { IUserRepository } from "src/core/interfaces";

export class UserRepository implements IUserRepository {
  client: PrismaClient;
  constructor(client: PrismaClient) {
    this.client = client;
  }
  getById(id: string): Promise<User | null> {
    throw new Error("Method not implemented.");
  }
  getByEmail(email: string): Promise<User | null> {
    return this.client.user.findUnique({
      where: { email },
      include: { account: true },
    });
  }
  save(user: User): Promise<User> {
    const { id, firstName, lastName, email, profileName, profilePicture } = user;
    const password = user.account?.getHashedPassword();

    // Handle optional fields by converting undefined to null for Prisma compatibility.
    const lastNameOrNull = lastName ?? null;
    const profileNameOrNull = profileName ?? null;
    const profilePictureOrNull = profilePicture ?? null;

    return this.client.user.upsert({
      where: { id },
      update: {
        firstName,
        lastName: lastNameOrNull,
        email,
        profileName: profileNameOrNull,
        profilePicture: profilePictureOrNull,
      },
      create: {
        id,
        firstName,
        lastName: lastNameOrNull,
        email,
        profileName: profileNameOrNull,
        profilePicture: profilePictureOrNull,
        account: { create: { password } },
      },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
  }
  delete(id: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
