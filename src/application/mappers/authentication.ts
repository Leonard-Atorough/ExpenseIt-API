import { Account, User } from "src/core/entities";
import type { UserResponseDto } from "../dtos";

export class AuthenticationMapper {
  public static toDomain(raw: any): User {
    return User.create({
      email: raw.email,
      firstName: raw.firstName,
      lastName: raw.lastName,
      ...(raw.password && { account: new Account(raw.password) }),
    });
  }

  public static toDomainFromPersistence(raw: any): User {
    return User.fromStorage({
      id: raw.id,
      email: raw.email,
      firstName: raw.firstName,
      lastName: raw.lastName,
      account: new Account(raw.account?.password || "", true),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  public static toPersistence(domain: User): any {
    return {
      id: domain.id,
      email: domain.email,
      firstName: domain.firstName,
      lastName: domain.lastName,
      password: domain.account.getHashedPassword(),
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  public static toDto(domain: User): UserResponseDto {
    return {
      id: domain.id!,
      email: domain.email,
      firstName: domain.firstName,
      lastName: domain.lastName,
    };
  }
}
