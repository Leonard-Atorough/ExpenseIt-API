import bcrypt from "bcrypt";

export class Account {
  #password: string;
  isHashed: boolean = false;

  private readonly SALT_ROUNDS = 12;
  constructor(password: string, isHashed: boolean = false) {
    this.#password = password;
    this.isHashed = isHashed;
  }

  /**
   * Hashes the account's password using bcrypt with a specified number of salt rounds. Returns a promise that resolves to the hashed password string.
   * @returns A promise that resolves to the hashed password string.
   * @throws An error if there is an issue during the hashing process.
   */
  hashPassword(): Promise<string> {
    return new Promise((resolve, reject) => {
      bcrypt.hash(this.#password, this.SALT_ROUNDS, (err, hash) => {
        if (err) {
          reject(err);
        } else {
          this.#password = hash;
          this.isHashed = true;
          resolve(hash);
        }
      });
    });
  }

  /**
   * Compares a plain password with the stored hashed password. Returns true if they match, false otherwise.
   * @param plainPassword The plain text password to compare against the stored hashed password.
   * @returns A promise that resolves to true if the passwords match, or false if they do not.
   * @throws An error if there is an issue during the comparison process.
   */
  verifyPassword(plainPassword: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      bcrypt.compare(plainPassword, this.#password, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  getHashedPassword(): string {
    return this.#password;
  }
}
