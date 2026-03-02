export interface UserResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  profileName?: string;
}

export interface AuthResponseDto {
  user: UserResponseDto;
  token: string;
  refreshToken: string;
}

export type UpdateUserResponseDto = UserResponseDto;

export interface RefreshTokenResponseDto {
  token: string;
  refreshToken: string;
}
