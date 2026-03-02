import BaseEntity from "../baseEntity";
import type { Account } from "./account";

export default class User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  account: Account;
  private constructor(
    id: string | undefined,
    email: string,
    firstName: string,
    lastName: string,
    account: Account,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
    this.account = account;
  }

  static create(params: {
    email: string;
    firstName: string;
    lastName: string;
    account: Account;
  }): User {
    const { email, firstName, lastName, account } = params;
    return new User(
      undefined,
      email,
      firstName,
      lastName,
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
    account: Account;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    const {
      id,
      email,
      firstName,
      lastName,
      account,
      createdAt,
      updatedAt,
    } = params;
    return new User(
      id,
      email,
      firstName,
      lastName,
      account,
      createdAt,
      updatedAt,
    );
  }

  update(params: {
    email?: string;
    firstName?: string;
    lastName?: string;
    account?: Account;
  }): void {
    const { email, firstName, lastName, account } = params;
    if (email) this.email = email;
    if (firstName) this.firstName = firstName;
    if (lastName) this.lastName = lastName;
    if (account) this.account = account;
  }
}
