import { vi } from "vitest";

process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

vi.mock("bcrypt", () => ({
  default: {
    compare: vi.fn(async () => true),
    hash: vi.fn(async (password: string) => `hashed-${password}`),
  },
  compare: vi.fn(async () => true),
  hash: vi.fn(async (password: string) => `hashed-${password}`),
}));
vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn(() => "mocked-jwt-token"),
    verify: vi.fn(),
  },
  sign: vi.fn(() => "mocked-jwt-token"),
  verify: vi.fn(),
}));
