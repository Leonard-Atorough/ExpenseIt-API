import { sign } from "crypto";
import { vi } from "vitest";

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
