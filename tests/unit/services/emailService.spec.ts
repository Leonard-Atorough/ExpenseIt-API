import { describe, it, expect, vi } from "vitest";
import "@src/services/emailService";

describe("Email Service", () => {
  describe("sendVerificationEmail", () => {
    it.todo("should send verification email");
    it.todo("should retry on failure with exponential backoff");
    it.todo("should store failed emails in database after max retries");
    it.todo("should handle SMTP errors gracefully");
  });

  describe("sendPasswordResetEmail", () => {
    it.todo("should send password reset email");
    it.todo("should include reset token in email");
    it.todo("should handle send failures");
  });

  describe("sendNotificationEmail", () => {
    it.todo("should send notification email with custom subject and message");
    it.todo("should handle send failures");
  });
});
