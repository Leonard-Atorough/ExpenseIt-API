export interface UserResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  profileName?: string;
}

export interface AuthResponseDto extends UserResponseDto {
  token: string;
}

export type UpdateUserResponseDto = UserResponseDto;

export interface TokenResponseDto {
  token: string;
}
