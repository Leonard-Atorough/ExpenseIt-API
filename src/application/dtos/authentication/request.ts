export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}


export interface LoginUserDto {
  email: string;
  password: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePicture?: string;
  profileName?: string;
}

export interface RefreshTokenDto {
  token: string;
}
