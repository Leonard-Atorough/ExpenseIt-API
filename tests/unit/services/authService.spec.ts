import { vi, describe, beforeEach, expect, it } from "vitest";
import { AuthenticationService } from "../../src/application/services/authenticationService";
import type { IUserRepository } from "../../src/core/interfaces/IUserRepository";
import type { ITokenRepository } from "../../src/core/interfaces/ITokenRepository";
import type { User } from "../../src/core/entities";
import { AuthenticationMapper } from "../../src/application/mappers/authentication";

// Mock the JWT utilities
vi.mock("../../src/api/utils/jwtUtils.ts", () => ({
  signJwt: vi.fn().mockResolvedValue("mocked-jwt-token"),
  verifyJwt: vi.fn(),
}));

vi.mock("../../src/api/utils/timeUtils.ts", () => ({
  parseExpiryToMs: vi.fn().mockReturnValue(900000), // 15 minutes in ms
}));

// Mock crypto.randomUUID
global.crypto.randomUUID = vi.fn(
  () =>
    "12345678-1234-5678-1234-567812345678" as `${string}-${string}-${string}-${string}-${string}`,
);

import { signJwt, verifyJwt } from "../../src/api/utils/jwtUtils";

const mockUser: User = {
  id: "user-id-123",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  account: {
    password: "hashed-password-123",
    hashPassword: vi.fn().mockResolvedValue(undefined),
    verifyPassword: vi.fn().mockResolvedValue(true),
  },
} as any;

describe("AuthenticationService", () => {
  let mockUserRepository: IUserRepository;
  let mockTokenRepository: ITokenRepository;
  let authService: AuthenticationService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserRepository = {
      getById: vi.fn(),
      getByEmail: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    mockTokenRepository = {
      saveRefreshToken: vi.fn(),
      revokeRefreshToken: vi.fn(),
      findTokenRecordById: vi.fn(),
    };

    authService = new AuthenticationService(mockUserRepository, mockTokenRepository);
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      const mockSavedUser = { ...mockUser };
      (mockUserRepository.save as any).mockResolvedValue(mockSavedUser);

      const response = await authService.register({
        firstName: "John",
        lastName: "Doe",
        email: "user@example.com",
        password: "securePassword123",
      });

      expect(response).toBeDefined();
      expect(response.email).toBe("user@example.com");
      expect(response.firstName).toBe("John");
      expect(response.lastName).toBe("Doe");
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it("should hash the password before saving", async () => {
      const mockSavedUser = { ...mockUser };
      (mockUserRepository.save as any).mockResolvedValue(mockSavedUser);

      await authService.register({
        firstName: "John",
        lastName: "Doe",
        email: "user@example.com",
        password: "securePassword123",
      });

      const savedUser = (mockUserRepository.save as any).mock.calls[0][0];
      expect(savedUser.account.hashPassword).toHaveBeenCalled();
    });

    it("should handle errors during registration", async () => {
      (mockUserRepository.save as any).mockRejectedValue(new Error("Database error"));

      await expect(
        authService.register({
          firstName: "John",
          lastName: "Doe",
          email: "user@example.com",
          password: "securePassword123",
        }),
      ).rejects.toThrow("Database error");
    });
  });

  describe("login", () => {
    beforeEach(() => {
      (mockUserRepository.getByEmail as any).mockResolvedValue(mockUser);
      (mockUser.account.verifyPassword as any).mockResolvedValue(true);
      (mockTokenRepository.saveRefreshToken as any).mockResolvedValue(undefined);
    });

    it("should login a user successfully with correct credentials", async () => {
      const response = await authService.login("user@example.com", "securePassword123");

      expect(response).toBeDefined();
      expect(response.user).toBeDefined();
      expect(response.token).toBe("mocked-jwt-token");
      expect(response.refreshToken).toBe("mocked-jwt-token");
      expect(mockUserRepository.getByEmail).toHaveBeenCalledWith("user@example.com");
      expect(mockTokenRepository.saveRefreshToken).toHaveBeenCalled();
    });

    it("should fail to login with non-existent email", async () => {
      (mockUserRepository.getByEmail as any).mockResolvedValue(null);

      await expect(authService.login("nonexistent@example.com", "password")).rejects.toThrow(
        "Invalid email or password",
      );

      expect(mockUserRepository.getByEmail).toHaveBeenCalledWith("nonexistent@example.com");
    });

    it("should fail to login with incorrect password", async () => {
      (mockUser.account.verifyPassword as any).mockResolvedValue(false);

      await expect(authService.login("user@example.com", "wrongPassword")).rejects.toThrow(
        "Invalid email or password",
      );

      expect(mockUserRepository.getByEmail).toHaveBeenCalledWith("user@example.com");
    });

    it("should handle database errors during login", async () => {
      (mockUserRepository.getByEmail as any).mockRejectedValue(new Error("Database error"));

      await expect(authService.login("user@example.com", "password")).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("refresh", () => {
    const mockValidToken = {
      rid: "refresh-token-id-valid",
      sub: "user-id-123",
    };

    const mockTokenRecord = {
      userId: "user-id-123",
      rid: "refresh-token-id-valid",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
      revokedAt: null,
    };

    beforeEach(() => {
      (verifyJwt as any).mockReturnValue(mockValidToken);
      (mockTokenRepository.findTokenRecordById as any).mockResolvedValue(mockTokenRecord);
      (mockTokenRepository.saveRefreshToken as any).mockResolvedValue(undefined);
    });

    it("should refresh token successfully with valid refresh token", async () => {
      const response = await authService.refresh({ rawRefresh: "valid-refresh-token" });

      expect(response).toBeDefined();
      expect(response.token).toBe("mocked-jwt-token");
      expect(response.refreshToken).toBe("mocked-jwt-token");
      expect(verifyJwt).toHaveBeenCalledWith("valid-refresh-token", process.env.JWT_REFRESH_SECRET);
      expect(mockTokenRepository.findTokenRecordById).toHaveBeenCalledWith(
        "refresh-token-id-valid",
      );
      expect(mockTokenRepository.saveRefreshToken).toHaveBeenCalled();
    });

    it("should fail to refresh with invalid token payload", async () => {
      (verifyJwt as any).mockReturnValue(null);

      await expect(authService.refresh({ rawRefresh: "invalid-token" })).rejects.toThrow(
        "Invalid refresh token",
      );
    });

    it("should fail to refresh when token record not found", async () => {
      (mockTokenRepository.findTokenRecordById as any).mockResolvedValue(null);

      await expect(authService.refresh({ rawRefresh: "valid-refresh-token" })).rejects.toThrow(
        "Invalid refresh token",
      );
    });

    it("should fail to refresh when token is revoked", async () => {
      const revokedToken = {
        ...mockTokenRecord,
        revokedAt: new Date(Date.now() - 1000 * 60 * 30), // revoked 30 minutes ago
      };
      (mockTokenRepository.findTokenRecordById as any).mockResolvedValue(revokedToken);

      await expect(authService.refresh({ rawRefresh: "revoked-token" })).rejects.toThrow(
        "Invalid refresh token",
      );
    });

    it("should handle database errors during token refresh", async () => {
      (mockTokenRepository.findTokenRecordById as any).mockRejectedValue(
        new Error("Database error"),
      );

      await expect(authService.refresh({ rawRefresh: "valid-refresh-token" })).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("logout", () => {
    const mockPayload = {
      rid: "refresh-token-id-123",
    };

    beforeEach(() => {
      (verifyJwt as any).mockReturnValue(mockPayload);
      (mockTokenRepository.revokeRefreshToken as any).mockResolvedValue(undefined);
    });

    it("should logout successfully by revoking the refresh token", async () => {
      await authService.logout({ rawRefresh: "some-refresh-token" });

      expect(verifyJwt).toHaveBeenCalledWith("some-refresh-token", process.env.JWT_REFRESH_SECRET);
      expect(mockTokenRepository.revokeRefreshToken).toHaveBeenCalledWith("refresh-token-id-123");
    });

    it("should fail to logout with invalid refresh token", async () => {
      (verifyJwt as any).mockReturnValue(null);

      await expect(authService.logout({ rawRefresh: "invalid-token" })).rejects.toThrow(
        "Invalid refresh token",
      );
    });

    it("should fail to logout when payload has no rid", async () => {
      (verifyJwt as any).mockReturnValue({ sub: "user-id-123" }); // Missing rid

      await expect(authService.logout({ rawRefresh: "invalid-token" })).rejects.toThrow(
        "Invalid refresh token",
      );
    });

    it("should handle database errors during logout", async () => {
      (mockTokenRepository.revokeRefreshToken as any).mockRejectedValue(
        new Error("Database error"),
      );

      await expect(authService.logout({ rawRefresh: "some-refresh-token" })).rejects.toThrow(
        "Database error",
      );
    });
  });
});