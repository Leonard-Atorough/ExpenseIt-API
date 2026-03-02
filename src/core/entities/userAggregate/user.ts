import BaseEntity from "../baseEntity";
import type { Account } from "./account";

export default class User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  profilePicture: string;
  profileName: string;
  account: Account;
  private constructor(
    id: string | undefined,
    email: string,
    firstName: string,
    lastName: string,
    profilePicture: string,
    profileName: string,
    account: Account,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
  }

  static create(params: {
    email: string;
    firstName: string;
    lastName: string;
    profilePicture: string;
    profileName: string;
    account: Account;
  }): User {
    const { email, firstName, lastName, profilePicture, profileName, account } = params;
    return new User(
      undefined,
      email,
      firstName,
      lastName,
      profilePicture,
      profileName,
      account,
      undefined,
      undefined,
    );
  }

  static fromStorage(params: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profilePicture: string;
    profileName: string;
    account: Account;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    const {
      id,
      email,
      firstName,
      lastName,
      profilePicture,
      profileName,
      account,
      createdAt,
      updatedAt,
    } = params;
    return new User(
      id,
      email,
      firstName,
      lastName,
      profilePicture,
      profileName,
      account,
      createdAt,
      updatedAt,
    );
  }

  update(params: {
    email?: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    profileName?: string;
    account?: Account;
  }): void {
    const { email, firstName, lastName, profilePicture, profileName, account } = params;
    if (email) this.email = email;
    if (firstName) this.firstName = firstName;
    if (lastName) this.lastName = lastName;
    if (profilePicture) this.profilePicture = profilePicture;
    if (profileName) this.profileName = profileName;
    if (account) this.account = account;
  }
}
