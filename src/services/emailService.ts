import nodemailer from "nodemailer";
import type { PrismaClient } from "@prisma/client";

export function emailService(prisma: PrismaClient) {
  const transporter = nodemailer.createTransport({
    // Configure your email service credentials here
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  async function sendVerificationEmail(email: string): Promise<void> {
    // Implementation to send email
    const token = "some-unique-token"; // Generate a unique token for verification
    console.log(`Sending verification email to ${email} with token ${token}`);
    const verificationLink = `https://localhost:3000/auth/verify?token=${token}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Please verify your email address",
      text: `Click the following link to verify your email: ${verificationLink}`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Verification email sent to ${email}`);
    } catch (error) {
      console.error(`Failed to send verification email to ${email}`, error);
      throw error;
    }
  }

  async function sendPasswordResetEmail(email: string): Promise<void> {
    // Implementation to send password reset email
  }

  async function sendNotificationEmail(
    email: string,
    subject: string,
    message: string
  ): Promise<void> {
    // Implementation to send notification email
  }

  return { sendVerificationEmail };
}
