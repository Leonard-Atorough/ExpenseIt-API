import { fail } from "assert/strict";
import { authService } from "@src/services/authService";
import { mockPrismaClient, type MockPrismaClient } from "../../__mocks__/mockPrismaClient";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { vi, describe, beforeEach, expect, it } from "vitest";
// Note: No need to directly import vitest, as the globals are automatically available but due to linting rules we import it here
// TODO: review linting rules to avoid such imports in future

// Converting these solitary unit tests into sociable tests with a mock database setup in the future

vi.mock("../../src/utils/prismaClient", () => {
  return {
    prismaClient: mockPrismaClient,
  };
});

const mockRegisteredUser = {
  id: "user-id-123",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
};

describe("Auth Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Register User Test
  describe("register", () => {
    beforeEach(() => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);
      mockPrismaClient.user.create.mockResolvedValue(mockRegisteredUser);
    });

    it("should register a new user successfully", async () => {
      const service = authService(mockPrismaClient as MockPrismaClient);
      const response = await service.register({
        firstName: "John",
        lastName: "Doe",
        email: "user@example.com",
        password: "securePassword123",
      });
      expect(response.ok).toBe(true);
      if (response.ok) {
        expect(response.code).toBe(201);
        expect(response.user).toEqual({
          id: "user-id-123",
          firstName: "John",
          lastName: "Doe",
          email: "user@example.com",
        });
      } else {
        fail(
          `Expected registration to succeed, but got code: ${response.code} and failure: ${response.message}`
        );
      }
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: "John",
            lastName: "Doe",
            email: "user@example.com",
            account: expect.objectContaining({
              create: expect.objectContaining({ password: expect.any(String) }),
            }),
            activationToken: expect.objectContaining({
              create: expect.objectContaining({
                token: expect.any(String),
                expiresAt: expect.any(Date),
              }),
            }),
          }),
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            activationToken: { select: { token: true } },
          },
        })
      );
    });

    it("should not allow registration with an existing email", async () => {
      mockPrismaClient.user.findUnique = vi.fn().mockResolvedValue(mockRegisteredUser);
      const service = authService(mockPrismaClient as MockPrismaClient);
      const response = await service.register({
        firstName: "Jane",
        lastName: "Smith",
        email: "user@example.com",
        password: "anotherPassword456",
      });
      expect(response.ok).toBe(false);
      if (!response.ok) {
        expect(response.code).toBe(409);
        expect(response.message).toBe("Email already in use");
      } else {
        fail(`Expected registration to fail, but got code: ${response.code} and success`);
      }
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: "user@example.com" },
      });
    });

    it("should handle errors during registration", async () => {
      mockPrismaClient.user.create = vi.fn().mockRejectedValue(new Error("Database error"));
      const service = authService(mockPrismaClient as MockPrismaClient);
      const response = await service.register({
        firstName: "Alice",
        lastName: "Johnson",
        email: "alice@example.com",
        password: "password789",
      });
      expect(response.ok).toBe(false);
      if (!response.ok) {
        expect(response.code).toBe(500);
        expect(response.message).toBe("Failed to register user");
        expect(response.internal).toBe("Error: Database error");
      } else {
        fail(`Expected registration to fail, but got code: ${response.code} and success`);
      }
      expect(mockPrismaClient.user.create).toHaveBeenCalled();
    });

    it("should set lastName to empty string if not provided", async () => {
      const mockRegisteredUserNoLastName = {
        id: "user-id-123",
        email: "bob@example.com",
        firstName: "John",
        lastName: "",
      };
      mockPrismaClient.user.create = vi.fn().mockResolvedValue(mockRegisteredUserNoLastName);

      const service = authService(mockPrismaClient as MockPrismaClient);
      const response = await service.register({
        firstName: "Bob",
        email: "bob@example.com",
        password: "password123",
      });
      expect(response.ok).toBe(true);
      if (response.ok) {
        expect(response.code).toBe(201);
        expect(response.user).toEqual({
          id: "user-id-123",
          firstName: "John",
          lastName: "",
          email: "bob@example.com",
        });
      } else {
        fail(
          `Expected registration to succeed, but got code: ${response.code} and failure: ${response.message}`
        );
      }

      expect(mockPrismaClient.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: "Bob",
            lastName: "",
            email: "bob@example.com",
            account: expect.objectContaining({
              create: expect.objectContaining({ password: expect.any(String) }),
            }),
          }),
        })
      );
    });

    it("should hash the password before storing", async () => {
      const service = authService(mockPrismaClient as MockPrismaClient);
      const plainPassword = "mySecretPassword";
      await service.register({
        firstName: "Charlie",
        lastName: "Brown",
        email: "charlie.brown@example.com",
        password: plainPassword,
      });
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          account: expect.objectContaining({
            create: expect.objectContaining({ password: `hashed-${plainPassword}` }),
          }),
          activationToken: expect.objectContaining({
            create: expect.objectContaining({
              token: expect.any(String),
              expiresAt: expect.any(Date),
            }),
          }),
        }),
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          activationToken: { select: { token: true } },
        },
      });
    });
  });

  // Verify User Test
  describe("verify", () => {
    beforeEach(() => {
      const mockUserWithAccountAndToken = {
        id: "user-id-123",
        email: "user@example.com",
        firstName: "John",
        lastName: "Doe",
        account: {
          password: "hashedPassword123",
          isVerified: false,
        },
        activationToken: {
          id: "activation-token-id-123",
          token: "valid-token",
          expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour in the future
          isExpired: false,
        },
      };

      mockPrismaClient.activationToken.findUnique = vi.fn().mockResolvedValue({
        id: "activation-token-id-123",
        token: "valid-token",
        userId: "user-id-123",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour in the future
      });

      mockPrismaClient.account.update.mockResolvedValue({
        id: "account-id-123",
        isVerified: true,
      });
      mockPrismaClient.activationToken.update.mockResolvedValue({
        id: "activation-token-id-123",
        token: "valid-token",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour in the future
        isExpired: true,
      });
    });

    it("should verify a user successfully with a valid token", async () => {
      mockPrismaClient.activationToken.findUnique = vi.fn().mockResolvedValue({
        id: "activation-token-id-123",
        token: "valid-token",
        userId: "user-id-123",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour in the future
      });
      const service = authService(mockPrismaClient as MockPrismaClient);

      const response = await service.verify({ token: "valid-token" });
      expect(response.ok).toBe(true);
      if (response.ok) {
        expect(response.code).toBe(200);
      } else {
        fail(
          `Expected verification to succeed, but got code: ${response.code} and failure: ${response.message}`
        );
      }

      expect(mockPrismaClient.account.update).toHaveBeenCalledWith({
        where: { userId: "user-id-123" },
        data: { isVerified: true },
      });
      expect(mockPrismaClient.activationToken.update).toHaveBeenCalledWith({
        where: { token: "valid-token" },
        data: { isExpired: true },
      });
    });

    it("should fail to verify user is verification token has expire", async () => {
      mockPrismaClient.activationToken.findUnique = vi.fn().mockResolvedValue({
        id: "activation-token-id-123",
        token: "valid-token",
        userId: "user-id-123",
        expiresAt: new Date(Date.now() - 1000 * 60 * 60), //1 hour ago
      });

      const service = authService(mockPrismaClient as MockPrismaClient);

      const response = await service.verify({ token: "valid-token" });

      expect(response.ok).toBe(false);
      if ("message" in response)
        expect(response.message).toBe("Invalid or expired verification token");
    });

    it("Should handle uncaught errors during verification", async () => {
      mockPrismaClient.activationToken.findUnique = vi
        .fn()
        .mockRejectedValue(new Error("Database error"));

      const service = authService(mockPrismaClient as MockPrismaClient);

      const response = await service.verify({ token: "valid-token" });

      expect(response.ok).toBe(false);
      if (response.code) expect(response.code).toEqual(500);
      if ("message" in response) expect(response.message).toBe("Failed to verify account");
    });
  });

  // Login User Test
  describe("login", () => {
    beforeEach(() => {
      const mockUserWithAccount = {
        id: "user-id-123",
        email: "user@example.com",
        firstName: "John",
        lastName: "Doe",
        account: {
          password: "hashedPassword123",
        },
      };

      mockPrismaClient.user.findUnique = vi.fn().mockImplementation(({ where: { email } }) => {
        if (email === "user@example.com") {
          return Promise.resolve(mockUserWithAccount);
        }
        return Promise.resolve(null);
      });
    });

    it("should login a user successfully with correct credentials", async () => {
      const service = authService(mockPrismaClient as MockPrismaClient);

      const response = await service.login({
        email: "user@example.com",
        password: "hashedPassword123",
      });
      expect(response.ok).toBe(true);
      if (response.ok) {
        expect(response.code).toBe(200);
        expect(response.data).toEqual({
          user: {
            id: "user-id-123",
            firstName: "John",
            lastName: "Doe",
            email: "user@example.com",
          },
          refreshToken: "mocked-jwt-token",
          accessToken: "mocked-jwt-token",
        });
      } else {
        fail(
          `Expected login to succeed, but got code: ${response.code} and failure: ${response.message}`
        );
      }
    });

    it("should fail to login with incorrect email", async () => {
      const service = authService(mockPrismaClient as MockPrismaClient);

      const response = await service.login({
        email: "incorrect@example.com",
        password: "somePassword",
      });
      expect(response.ok).toBe(false);
      if (!response.ok) {
        expect(response.code).toBe(401);
        expect(response.message).toBe("Authentication failed");
        expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
          where: { email: "incorrect@example.com" },
          include: { account: true },
        });
      } else {
        fail(`Expected login to fail, but got code: ${response.code} and success`);
      }
    });

    it("should fail to login with incorrect password", async () => {
      // Re-initialize the mock to return false for password comparison
      bcrypt.compare = vi.fn().mockResolvedValue(false);

      const service = authService(mockPrismaClient as MockPrismaClient);

      const response = await service.login({
        email: "user@example.com",
        password: "wrongPassword",
      });
      expect(response.ok).toBe(false);
      if (!response.ok) {
        expect(response.code).toBe(401);
        expect(response.message).toBe("Authentication failed: Incorrect password");
        expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
          where: { email: "user@example.com" },
          include: { account: true },
        });
      } else {
        fail(`Expected login to fail, but got code: ${response.code} and success`);
      }
    });

    it("should handle errors during login", async () => {
      // Re-initialize the mock to reject for this test case
      mockPrismaClient.user.findUnique = vi.fn().mockRejectedValue(new Error("Database error"));
      const service = authService(mockPrismaClient as MockPrismaClient);

      const response = await service.login({
        email: "user@example.com",
        password: "somePassword",
      });

      expect(response.ok).toBe(false);
      if (!response.ok) {
        expect(response.code).toBe(500);
        expect(response.message).toBe("Failed to login");
        expect(response.internal).toBe("Error: Database error");
        expect(mockPrismaClient.user.findUnique).toHaveBeenCalled();
      } else {
        fail(`Expected login to fail, but got code: ${response.code} and success`);
      }
    });
  });
  // Refresh Token Test
  describe("refreshToken", () => {
    beforeEach(() => {
      mockPrismaClient.refreshToken.create = vi.fn().mockResolvedValue({
        id: "refresh-token-id-001",
      });

      vi.mocked(jwt.verify).mockImplementation((token: string) => {
        if (token === "valid-refresh-token") {
          return { sub: "user-id-123", rid: "refresh-token-id-valid" };
        } else if (token === "expired-refresh-token") {
          return { sub: "user-id-123", rid: "refresh-token-id-expired" };
        } else if (token === "revoked-refresh-token") {
          return { sub: "user-id-123", rid: "refresh-token-id-revoked" };
        } else {
          return { sub: "user-id-123", rid: "refresh-token-id-invalid" };
        }
      });

      mockPrismaClient.refreshToken.findUnique = vi.fn().mockImplementation(({ where: { id } }) => {
        if (id === "refresh-token-id-valid") {
          return Promise.resolve({
            id: "refresh-token-id-123",
            userId: "user-id-123",
            expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour in the future
            revokedAt: null,
          });
        } else if (id === "refresh-token-id-expired") {
          return Promise.resolve({
            id: "refresh-token-id-456",
            userId: "user-id-123",
            expiresAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour in the past
            revokedAt: null,
          });
        } else if (id === "refresh-token-id-revoked") {
          return Promise.resolve({
            id: "refresh-token-id-789",
            userId: "user-id-123",
            expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour in the future
            revokedAt: new Date(Date.now() - 1000 * 60 * 30), // revoked 30 minutes ago
          });
        }
        return Promise.resolve(null);
      });

      mockPrismaClient.refreshToken.update = vi
        .fn()
        .mockResolvedValue({ id: "new-refresh-token-id" });

      mockPrismaClient.$transaction = vi.fn().mockImplementation(async (operations: any[]) => {
        for (const op of operations) {
          await op;
        }
        return;
      });
    });
    it("should refresh token successfully with valid refresh token", async () => {
      const service = authService(mockPrismaClient as MockPrismaClient);

      const response = await service.refresh({
        rawRefresh: "valid-refresh-token",
      });
      expect(response.ok).toBe(true);
      if (response.ok) {
        expect(response.code).toBe(200);
        expect(response.data).toEqual({
          token: expect.any(String),
          refreshToken: expect.any(String),
        });
      } else {
        fail(
          `Expected token refresh to succeed, but got code: ${response.code} and failure: ${response.message}`
        );
      }

      expect(mockPrismaClient.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { id: "refresh-token-id-valid" },
      });
    });

    it("should fail to refresh token with invalid refresh token", async () => {
      const service = authService(mockPrismaClient as MockPrismaClient);

      const response = await service.refresh({
        rawRefresh: "invalid-refresh-token",
      });

      expect(response.ok).toBe(false);
      if (!response.ok) {
        expect(response.code).toBe(401);
        expect(response.message).toBe("Invalid refresh token");
        expect(response.internal).toBe("Refresh token not found or revoked");
        expect(mockPrismaClient.refreshToken.findUnique).toHaveBeenCalledWith({
          where: { id: "refresh-token-id-invalid" },
        });
      } else {
        fail(`Expected token refresh to fail, but got code: ${response.code} and success`);
      }
    });

    it("should fail to refresh token when refresh token is expired", async () => {
      const service = authService(mockPrismaClient as MockPrismaClient);

      const response = await service.refresh({
        rawRefresh: "expired-refresh-token",
      });

      expect(response.ok).toBe(false);
      if (response.ok === false) {
        expect(response.code).toBe(401);
        expect(response.message).toBe("Invalid refresh token");
        expect(response.internal).toBe("Refresh token expired");
        expect(mockPrismaClient.refreshToken.findUnique).toHaveBeenCalledWith({
          where: { id: "refresh-token-id-expired" },
        });
      } else {
        fail(`Expected token refresh to fail, but got code: ${response.code} and success`);
      }
    });
    it("should fail to refresh token when refresh token is revoked", async () => {
      const service = authService(mockPrismaClient as MockPrismaClient);

      const response = await service.refresh({
        rawRefresh: "revoked-refresh-token",
      });

      expect(response.ok).toBe(false);
      if (response.ok === false) {
        expect(response.code).toBe(401);
        expect(response.message).toBe("Invalid refresh token");
        expect(response.internal).toBe("Refresh token not found or revoked");
        expect(mockPrismaClient.refreshToken.findUnique).toHaveBeenCalledWith({
          where: { id: "refresh-token-id-revoked" },
        });
      } else {
        fail(`Expected token refresh to fail, but got code: ${response.code} and success`);
      }
    });
    it("should handle errors during token refresh", async () => {
      // Re-initialize the mock to reject for this test case
      mockPrismaClient.refreshToken.findUnique = vi
        .fn()
        .mockRejectedValue(new Error("Database error"));
      const service = authService(mockPrismaClient as MockPrismaClient);

      const response = await service.refresh({
        rawRefresh: "valid-refresh-token",
      });
      expect(response.ok).toBe(false);
      if (!response.ok) {
        expect(response.code).toBe(500);
        expect(response.message).toBe("Failed to refresh tokens");
        expect(response.internal).toBe("Error: Database error");
        expect(mockPrismaClient.refreshToken.findUnique).toHaveBeenCalled();
      } else {
        fail(`Expected token refresh to fail, but got code: ${response.code} and success`);
      }
    });
  });

  // Logout User Test
  describe("logout", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.mocked(jwt.verify).mockImplementation(() => ({ rid: "revoked-refresh-token-id" }));
      mockPrismaClient.refreshToken.update = vi.fn().mockResolvedValue({
        id: "revoked-refresh-token-id",
      });
    });

    it("should logout successfully by revoking the refresh token", async () => {
      const service = authService(mockPrismaClient as MockPrismaClient);
      const response = await service.logout({
        rawRefresh: "some-refresh-token",
      });
      expect(response.ok).toBe(true);
      if (response.ok) {
        expect(response.code).toBe(200);
      } else {
        fail(
          `Expected logout to succeed, but got code: ${response.code} and failure: ${response.message}`
        );
      }
    });

    it("should fail to logout with invalid refresh token", async () => {
      // Mock the JWT verify to throw an error for invalid token
      vi.mocked(jwt.verify).mockImplementation(() => null);

      const service = authService(mockPrismaClient as MockPrismaClient);
      const response = await service.logout({
        rawRefresh: "invalid-refresh-token",
      });
      expect(response.ok).toBe(false);
      if (!response.ok) {
        expect(response.code).toBe(400);
        expect(response.message).toBe("Invalid refresh token");
        expect(response.internal).toBe("JWT verification failed");
      } else {
        fail(`Expected logout to fail, but got code: ${response.code} and success`);
      }
    });

    it("should handle errors during logout", async () => {
      const service = authService(mockPrismaClient as MockPrismaClient);
      // Mock the update method to throw an error
      mockPrismaClient.refreshToken.update = vi.fn().mockRejectedValue(new Error("Database error"));

      const response = await service.logout({
        rawRefresh: "some-refresh-token",
      });
      expect(response.ok).toBe(false);
      if (!response.ok) {
        expect(response.code).toBe(500);
        expect(response.message).toBe("Failed to logout");
        expect(response.internal).toBe("Error: Database error");
        expect(mockPrismaClient.refreshToken.update).toHaveBeenCalled();
      } else {
        fail(`Expected logout to fail, but got code: ${response.code} and success`);
      }
    });
  });
});
