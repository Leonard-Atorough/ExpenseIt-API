export interface User {
  id: number;
  email: string;
  password: string;
  createdAt: Date;
}

export interface UserWithoutPassword {
  id: number;
  email: string;
  createdAt: Date;
}
