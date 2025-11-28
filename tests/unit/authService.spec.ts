import { authService } from "../../src/services/authService";
import { mockPrismaClient } from "../__mocks__/mockPrismaClient";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// Note: No need to directly import vitest, as the globals are automatically available

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
      const service = authService(mockPrismaClient as any);
      const response = await service.register({
        firstName: "John",
        lastName: "Doe",
        email: "user@example.com",
        password: "securePassword123",
      });
      expect(response.ok).toBe(true);
      expect(response.code).toBe(201);
      expect(response.data).toEqual({
        id: "user-id-123",
        firstName: "John",
        lastName: "Doe",
        email: "user@example.com",
      });
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: "John",
            lastName: "Doe",
            email: "user@example.com",
            account: expect.objectContaining({
              create: expect.objectContaining({ password: expect.any(String) }),
            }),
          }),
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      );
    });

    it("should not allow registration with an existing email", async () => {
      mockPrismaClient.user.findUnique = vi.fn().mockResolvedValue(mockRegisteredUser);
      const service = authService(mockPrismaClient as any);
      const response = await service.register({
        firstName: "Jane",
        lastName: "Smith",
        email: "user@example.com",
        password: "anotherPassword456",
      });
      expect(response.ok).toBe(false);
      expect(response.code).toBe(400);
      expect(response.message).toBe("Email already in use");
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: "user@example.com" },
      });
    });

    it("should handle errors during registration", async () => {
      mockPrismaClient.user.create = vi.fn().mockRejectedValue(new Error("Database error"));
      const service = authService(mockPrismaClient as any);
      const response = await service.register({
        firstName: "Alice",
        lastName: "Johnson",
        email: "alice@example.com",
        password: "password789",
      });
      expect(response.ok).toBe(false);
      expect(response.code).toBe(500);
      expect(response.message).toBe("Failed to register user");
      expect(response.internal).toBe("Error: Database error");
      expect(mockPrismaClient.user.create).toHaveBeenCalled();
    });

    it("should set lastName to null if not provided", async () => {
      const mockRegisteredUserNoLastName = {
        id: "user-id-123",
        email: "bob@example.com",
        firstName: "John",
        lastName: null,
      };
      mockPrismaClient.user.create = vi.fn().mockResolvedValue(mockRegisteredUserNoLastName);

      const service = authService(mockPrismaClient as any);
      const response = await service.register({
        firstName: "Bob",
        email: "bob@example.com",
        password: "password123",
      });
      expect(response.ok).toBe(true);
      expect(response.code).toBe(201);
      expect(response.data).toEqual({
        id: "user-id-123",
        firstName: "John",
        lastName: null,
        email: "bob@example.com",
      });

      expect(mockPrismaClient.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: "Bob",
            lastName: null,
            email: "bob@example.com",
            account: expect.objectContaining({
              create: expect.objectContaining({ password: expect.any(String) }),
            }),
          }),
        })
      );
    });

    it("should hash the password before storing", async () => {
      const service = authService(mockPrismaClient as any);
      const plainPassword = "mySecretPassword";
      await service.register({
        firstName: "Charlie",
        lastName: "Brown",
        email: "charlie.brown@example.com",
        password: plainPassword,
      });
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            account: expect.objectContaining({
              create: expect.objectContaining({
                password: expect.not.stringContaining(plainPassword),
              }),
            }),
          }),
        })
      );
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
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUserWithAccount);
    });

    it("should login a user successfully with correct credentials", async () => {
      vi.spyOn(bcrypt, "compare").mockResolvedValue(true);
      vi.spyOn(jwt, "sign").mockReturnValue("mocked-jwt-token");

      const service = authService(mockPrismaClient as any);

      const response = await service.login({
        email: "user@example.com",
        password: "hashedPassword123",
      });
      expect(response.ok).toBe(true);
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
    });

    it("should fail to login with incorrect email", async () => {});

    it("should fail to login with incorrect password", async () => {});

    it("should handle errors during login", async () => {});
  });
  // Refresh Token Test

  // Logout User Test
});
