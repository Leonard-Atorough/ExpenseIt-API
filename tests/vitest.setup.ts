import { sign } from "crypto";
import { vi } from "vitest";

// Set required environment variables for tests
process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

const mockBcryptHash = vi.fn((password: string, saltOrRounds: number | string, callback?: Function) => {
  const result = `hashed-${password}`;
  if (typeof callback === "function") {
    callback(null, result);
    return;
  }
  return Promise.resolve(result);
});

const mockBcryptCompare = vi.fn((plain: string, hash: string, callback?: Function) => {
  if (typeof callback === "function") {
    callback(null, true);
    return;
  }
  return Promise.resolve(true);
});

vi.mock("bcrypt", () => ({
  default: {
    compare: mockBcryptCompare,
    hash: mockBcryptHash,
  },
  compare: mockBcryptCompare,
  hash: mockBcryptHash,
}));
vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(() => "mocked-jwt-token"),
    verify: vi.fn(),
  },
  sign: vi.fn(() => "mocked-jwt-token"),
  verify: vi.fn(),
}));
