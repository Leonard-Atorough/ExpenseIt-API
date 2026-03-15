import nodemailer from "nodemailer";
import type { PrismaClient } from "@prisma/client";
import { ENVIRONMENT_CONFIG } from "@config";
import { logger } from "@src/api/middleware/index.js";

export function emailService(prisma: PrismaClient) {
  const transporter = nodemailer.createTransport({
    // Configure your email service credentials here
    service: "gmail",
    auth: {
      user: ENVIRONMENT_CONFIG.EMAIL_USERNAME,
      pass: ENVIRONMENT_CONFIG.EMAIL_PASSWORD,
    },
  });

  async function sendVerificationEmail(email: string, token: string): Promise<void> {
    // Implementation to send email
    logger.info(`Sending verification email to ${email} with token ${token}`);
    const verificationLink = `https://localhost:3001/auth/verify?token=${token}`;
    const mailOptions = {
      from: ENVIRONMENT_CONFIG.EMAIL_USERNAME,
      to: email,
      subject: "Please verify your email address",
      text: `Click the following link to verify your email: ${verificationLink}`,
    };

    try {
      await transporter.sendMail(mailOptions);
      logger.info(`Verification email sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send verification email to ${email}`, { error });
      throw error;
    }
  }

  async function sendPasswordResetEmail(email: string): Promise<void> {
    // Implementation to send password reset email
  }

  async function sendNotificationEmail(
    email: string,
    subject: string,
    message: string,
  ): Promise<void> {
    // Implementation to send notification email
  }

  return { sendVerificationEmail };
}
