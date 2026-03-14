import type { UpdateUserDto, UpdateUserResponseDto, UserResponseDto } from "../dtos";
import type { IUserRepository } from "src/core/interfaces";
import { AuthenticationMapper } from "../mappers/authentication.mapper";
import { NotFoundError } from "../errors";

export class UserService {
  userRepository: IUserRepository;
  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async UpdateUser(id: string, data: UpdateUserDto): Promise<UpdateUserResponseDto> {
    const existingUser = await this.userRepository.getById(id);

    if (!existingUser) {
      throw new NotFoundError("User not found");
    }

    existingUser.update({
      firstName: data.firstName,
      lastName: data.lastName,
    });

    const savedUser = await this.userRepository.save(AuthenticationMapper.toDomain(existingUser));

    return AuthenticationMapper.toDto(savedUser);
  }
  async GetUserById(id: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.getById(id);

    if (!user) {
      throw new NotFoundError("User not found");
    }
    return AuthenticationMapper.toDto(user);
  }
  async GetUserByEmail(email: string): Promise<UserResponseDto | null> {
    const user = await this.userRepository.getByEmail(email);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return AuthenticationMapper.toDto(user);
  }
}
