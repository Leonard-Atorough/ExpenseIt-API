import type { PrismaClient } from "@prisma/client";
import type { User } from "src/core/entities";
import type { IUserRepository } from "src/core/interfaces";
import { AuthenticationMapper } from "src/application/mappers/authentication";

export class UserRepository implements IUserRepository {
  client: PrismaClient;
  constructor(client: PrismaClient) {
    this.client = client;
  }

  async getById(id: string): Promise<User | null> {
    const rawUser = await this.client.user.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!rawUser) return null;

    return AuthenticationMapper.toDomainFromPersistence(rawUser);
  }

  async getByEmail(email: string): Promise<User | null> {
    const rawUser = await this.client.user.findUnique({
      where: { email },
      include: { account: true },
    });

    if (!rawUser) return null;

    return AuthenticationMapper.toDomainFromPersistence(rawUser);
  }

  async save(user: User): Promise<User> {
    const { id, firstName, lastName, email } = user;
    const password = user.account?.getHashedPassword();

    if (id) {
      const existingUser = await this.client.user.findUnique({
        where: { id },
      });

      if (existingUser) {
        const updatedUser = await this.client.user.update({
          where: { id },
          data: {
            firstName,
            email,
            ...(lastName !== undefined && { lastName }),
          },
          include: { account: true },
        });

        return AuthenticationMapper.toDomainFromPersistence(updatedUser);
      }
    }

    const newUser = await this.client.user.create({
      data: {
        firstName,
        email,
        ...(lastName !== undefined && { lastName }),
        account: password ? { create: { password } } : undefined,
      },
      include: { account: true },
    });

    return AuthenticationMapper.toDomainFromPersistence(newUser);
  }

  async delete(id: string): Promise<void> {
    await this.client.user.delete({
      where: { id },
    });
  }
}
