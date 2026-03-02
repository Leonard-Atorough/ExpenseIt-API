import type { User } from "src/core/entities";
import type { IUserRepository, ITokenRepository } from "../../core/interfaces";
import type {
  AuthResponseDto,
  CreateUserDto,
  RefreshTokenResponseDto,
  UserResponseDto,
} from "../dtos";
import { AuthenticationMapper } from "../mappers/authentication";
import { signJwt, verifyJwt } from "src/api/utils/jwtUtils";
import { parseExpiryToMs } from "src/api/utils/timeUtils";
import type { JwtPayload } from "jsonwebtoken";

interface JwtPayloadWithRid extends JwtPayload {
  rid: string;
}

export class AuthenticationService {
  private userRepository: IUserRepository;
  private tokenRepository: ITokenRepository;
  private jwtAccessSecret: string;
  private jwtRefreshSecret: string;
  constructor(userRepository: IUserRepository, tokenRepository: ITokenRepository) {
    this.userRepository = userRepository;
    this.tokenRepository = tokenRepository;
    if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
      throw new Error("JWT secrets are not defined in environment variables");
    }
    this.jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  }

  async getCurrentUser(userId: string | undefined): Promise<UserResponseDto> {
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await this.userRepository.getById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    return AuthenticationMapper.toDto(user);
  }

  async register(user: CreateUserDto): Promise<UserResponseDto> {
    const newUser: User = AuthenticationMapper.toDomain(user);

    await newUser.account.hashPassword();

    const createdUser = await this.userRepository.save(newUser);

    return AuthenticationMapper.toDto(createdUser);
  }

  async login(email: string, password: string): Promise<AuthResponseDto> {
    const user = await this.userRepository.getByEmail(email);

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = await user.account.verifyPassword(password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    const token = await signJwt(
      { sub: String(user.id), exp: parseExpiryToMs(process.env.ACCESS_TOKEN_EXP || "15m") / 1000 },
      this.jwtAccessSecret,
    );

    const refreshId = crypto.randomUUID();
    const refreshToken = await signJwt(
      {
        sub: String(user.id),
        rid: refreshId,
        exp: parseExpiryToMs(process.env.REFRESH_TOKEN_EXP || "7d") / 1000,
      },
      this.jwtRefreshSecret,
    );

    const now = new Date();

    await this.tokenRepository.saveRefreshToken(
      String(user.id),
      refreshId,
      new Date(now.getTime()),
      new Date(now.getTime() + parseExpiryToMs(process.env.REFRESH_TOKEN_EXP || "7d")),
    );

    return {
      user: AuthenticationMapper.toDto(user),
      token,
      refreshToken,
    };
  }

  async refresh(params: { rawRefresh: string }): Promise<RefreshTokenResponseDto> {
    const { rawRefresh } = params;

    const payload = verifyJwt(rawRefresh, this.jwtRefreshSecret);

    if (!payload || typeof payload === "string" || !("rid" in payload)) {
      throw new Error("Invalid refresh token");
    }

    const { rid, sub } = payload as JwtPayloadWithRid;

    const tokenRecord = await this.tokenRepository.findTokenRecordById(rid);

    if (!tokenRecord || tokenRecord.revokedAt) {
      throw new Error("Invalid refresh token");
    }

    const newToken = await signJwt(
      { sub: String(sub), exp: parseExpiryToMs(process.env.ACCESS_TOKEN_EXP || "15m") / 1000 },
      this.jwtAccessSecret,
    );

    const newRefreshId = crypto.randomUUID();
    const newRefreshToken = await signJwt(
      {
        sub: String(sub),
        rid: newRefreshId,
        exp: parseExpiryToMs(process.env.REFRESH_TOKEN_EXP || "7d") / 1000,
      },
      this.jwtRefreshSecret,
    );

    const now = new Date();

    await this.tokenRepository.saveRefreshToken(
      String(sub),
      newRefreshId,
      now,
      new Date(now.getTime() + parseExpiryToMs(process.env.REFRESH_TOKEN_EXP || "7d")),
    );

    return {
      token: newToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(params: { rawRefresh: string }): Promise<void> {
    const { rawRefresh } = params;
    const payload = verifyJwt(rawRefresh, this.jwtRefreshSecret);

    if (!payload || typeof payload === "string" || !("rid" in payload)) {
      throw new Error("Invalid refresh token");
    }
    const { rid } = payload as JwtPayloadWithRid;

    await this.tokenRepository.revokeRefreshToken(rid);
  }
}
