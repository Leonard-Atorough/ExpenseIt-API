import { Account, User } from "src/core/entities";
import type { UserResponseDto } from "../dtos";

export class AuthenticationMapper {
  public static toDomain(raw: any): User {
    return User.create({
      email: raw.email,
      firstName: raw.firstName,
      lastName: raw.lastName,
      profilePicture: raw.profilePicture,
      profileName: raw.profileName,
      ...(raw.password && { account: new Account(raw.password) }),
    });
  }

  public static toDomainFromPersistence(raw: any): User {
    return User.fromStorage({
      id: raw.id,
      email: raw.email,
      firstName: raw.firstName,
      lastName: raw.lastName,
      profilePicture: raw.profilePicture,
      profileName: raw.profileName,
      account: new Account(raw.password),
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
      profilePicture: domain.profilePicture,
      profileName: domain.profileName,
      password: domain.account.getHashedPassword(),
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  public static toDto(domain: User): UserResponseDto {
    return {
      id: domain.id,
      email: domain.email,
      firstName: domain.firstName,
      lastName: domain.lastName,
      profilePicture: domain.profilePicture,
      profileName: domain.profileName,
    };
  }
}
