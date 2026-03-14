import type { User } from "src/core/entities";
import type { IUserRepository, ITokenRepository } from "../../core/interfaces";
import type { AuthResponseDto, CreateUserDto, TokenResponseDto, UserResponseDto } from "../dtos";
import { AuthenticationMapper } from "../mappers/authentication";
import { signJwt, verifyJwt } from "src/api/utils/jwtUtils";
import { parseExpiryToMs } from "src/api/utils/timeUtils";
import type { JwtPayload } from "jsonwebtoken";
import { ENVIRONMENT_CONFIG } from "@config";

interface JwtPayloadWithRid extends JwtPayload {
  rid: string;
}

export class AuthenticationService {
  private readonly CONVERT_TO_SECONDS = 1000;
  private readonly TOKEN_EXPIRY_SECONDS =
    parseExpiryToMs(ENVIRONMENT_CONFIG.ACCESS_TOKEN_EXPIRATION) / this.CONVERT_TO_SECONDS;
  private readonly REFRESH_EXPIRY_SECONDS =
    parseExpiryToMs(ENVIRONMENT_CONFIG.REFRESH_TOKEN_EXPIRATION) / this.CONVERT_TO_SECONDS;

  private userRepository: IUserRepository;
  private tokenRepository: ITokenRepository;
  private jwtAccessSecret: string;
  private jwtRefreshSecret: string;
  constructor(userRepository: IUserRepository, tokenRepository: ITokenRepository) {
    this.userRepository = userRepository;
    this.tokenRepository = tokenRepository;
    if (!ENVIRONMENT_CONFIG.JWT_ACCESS_SECRET || !ENVIRONMENT_CONFIG.JWT_REFRESH_SECRET) {
      throw new Error("JWT secrets are not defined in environment variables");
    }
    this.jwtAccessSecret = ENVIRONMENT_CONFIG.JWT_ACCESS_SECRET;
    this.jwtRefreshSecret = ENVIRONMENT_CONFIG.JWT_REFRESH_SECRET;
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

  async login(
    email: string,
    password: string,
  ): Promise<{ authUser: AuthResponseDto; refreshToken: string }> {
    const user = await this.userRepository.getByEmail(email);

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = await user.account.verifyPassword(password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    const now = new Date();

    const token = await signJwt(
      {
        sub: String(user.id),
        exp: Math.floor(now.getTime() / this.CONVERT_TO_SECONDS) + this.TOKEN_EXPIRY_SECONDS,
      },
      this.jwtAccessSecret,
    );

    const refreshId = crypto.randomUUID();
    const refreshToken = await signJwt(
      {
        sub: String(user.id),
        rid: refreshId,
        exp: Math.floor(now.getTime() / this.CONVERT_TO_SECONDS) + this.REFRESH_EXPIRY_SECONDS,
      },
      this.jwtRefreshSecret,
    );

    await this.tokenRepository.saveRefreshToken(
      String(user.id),
      refreshId,
      new Date(now.getTime()),
      new Date(now.getTime() + this.REFRESH_EXPIRY_SECONDS * this.CONVERT_TO_SECONDS),
    );

    return {
      authUser: { ...AuthenticationMapper.toDto(user), token } as AuthResponseDto,
      refreshToken,
    };
  }

  async refresh(params: {
    rawRefresh: string;
  }): Promise<{ token: TokenResponseDto; refreshToken: string }> {
    const { rawRefresh } = params;

    const payload = await verifyJwt(rawRefresh, this.jwtRefreshSecret);

    const now = new Date();

    if (!payload || typeof payload === "string" || !("rid" in payload)) {
      throw new Error("Invalid refresh token");
    }

    const { rid, sub } = payload as JwtPayloadWithRid;

    const tokenRecord = await this.tokenRepository.findTokenRecordById(rid);

    if (!tokenRecord || tokenRecord.revokedAt) {
      throw new Error("Invalid refresh token");
    }

    if (tokenRecord.userId !== sub) {
      throw new Error("Invalid refresh token");
    }

    if (tokenRecord.expiresAt < now) {
      throw new Error("Refresh token has expired");
    }

    await this.tokenRepository.revokeRefreshToken(rid);

    const newToken = await signJwt(
      {
        sub: String(sub),
        exp: Math.floor(now.getTime() / this.CONVERT_TO_SECONDS) + this.TOKEN_EXPIRY_SECONDS,
      },
      this.jwtAccessSecret,
    );

    const newRefreshId = crypto.randomUUID();

    const newRefreshToken = await signJwt(
      {
        sub: String(sub),
        rid: newRefreshId,
        exp: Math.floor(now.getTime() / this.CONVERT_TO_SECONDS) + this.REFRESH_EXPIRY_SECONDS,
      },
      this.jwtRefreshSecret,
    );

    await this.tokenRepository.saveRefreshToken(
      String(sub),
      newRefreshId,
      now,
      new Date(now.getTime() + this.REFRESH_EXPIRY_SECONDS * this.CONVERT_TO_SECONDS),
    );

    return {
      token: { token: newToken } as TokenResponseDto,
      refreshToken: newRefreshToken,
    };
  }

  async logout(params: { rawRefresh: string }): Promise<void> {
    const { rawRefresh } = params;
    const payload = await verifyJwt(rawRefresh, this.jwtRefreshSecret);

    if (!payload || typeof payload === "string" || !("rid" in payload)) {
      throw new Error("Invalid refresh token");
    }
    const { rid } = payload as JwtPayloadWithRid;

    await this.tokenRepository.revokeRefreshToken(rid);
  }

  /**
   * This method is for testing purposes only. It allows us to generate a token for a user without going through the login process.
   *
   * @param userId - The ID of the user for whom to generate the token
   * @returns An object containing the generated access token and refresh token
   */
  async generateToken(userId: string): Promise<{ token: TokenResponseDto; refreshToken: string }> {
    const user = await this.userRepository.getById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const now = new Date();

    const token = await signJwt(
      {
        sub: String(user.id),
        exp: Math.floor(now.getTime() / this.CONVERT_TO_SECONDS) + this.TOKEN_EXPIRY_SECONDS,
      },
      this.jwtAccessSecret,
    );

    const refreshId = crypto.randomUUID();
    const refreshToken = await signJwt(
      {
        sub: String(user.id),
        rid: refreshId,
        exp: Math.floor(now.getTime() / this.CONVERT_TO_SECONDS) + this.REFRESH_EXPIRY_SECONDS,
      },
      this.jwtRefreshSecret,
    );

    await this.tokenRepository.saveRefreshToken(
      String(user.id),
      refreshId,
      new Date(now.getTime()),
      new Date(now.getTime() + this.REFRESH_EXPIRY_SECONDS * this.CONVERT_TO_SECONDS),
    );

    return {
      token: { token } as TokenResponseDto,
      refreshToken,
    };
  }
}
