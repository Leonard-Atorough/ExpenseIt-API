import type { UpdateUserDto, UpdateUserResponseDto, UserResponseDto } from "../dtos";
import type { IUserRepository } from "src/core/interfaces";
import { AuthenticationMapper } from "../mappers/authentication";

export class UserService {
  userRepository: IUserRepository;
  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async UpdateUser(id: string, data: UpdateUserDto): Promise<UpdateUserResponseDto> {
    const existingUser = await this.userRepository.getById(id);

    if (!existingUser) {
      throw new Error("User not found");
    }

    const updatedUser = existingUser.update({
      firstName: data.firstName,
      lastName: data.lastName,
      profilePicture: data.profilePicture,
      profileName: data.profileName,
    });

    const userToSave = AuthenticationMapper.toDomain(updatedUser);

    const savedUser = await this.userRepository.save(userToSave);

    if (!savedUser) {
      throw new Error("Failed to update user");
    }

    return AuthenticationMapper.toDto(savedUser);
  }
  async GetUserById(id: string): Promise<UserResponseDto | null> {
    throw new Error("Method not implemented.");
  }
  async GetUserByEmail(email: string): Promise<UserResponseDto | null> {
    throw new Error("Method not implemented.");
  }
}
