// src/controllers/LoginChefController.ts
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { sign, type Secret } from "jsonwebtoken";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation schema for login input
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const JWT_COOKIE_NAME = "chef_access_token";

// Helper: get numeric expiresIn (in seconds) to keep TS happy across versions
function getJwtExpiresInSeconds(): number {
  const fromEnv = process.env.JWT_EXPIRES_IN;
  const asNumber = fromEnv ? Number(fromEnv) : NaN;
  return Number.isFinite(asNumber) ? asNumber : 7 * 24 * 60 * 60; // default 7 days
}

export async function LoginChefController(req: Request, res: Response) {
  try {
    // 1) Validate request body using Zod schema
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid email or password." });
    }
    const { email, password } = parsed.data;

    // 2) Find chef by email (fields must match your Prisma schema)
    const chef = await prisma.chef.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        passwordHash: true
      }
    });

    // Uniform error to avoid leaking which part failed
    if (!chef) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // 3) Compare plaintext password with stored hash
    const isPasswordValid = await bcrypt.compare(password, chef.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // 4) Generate JWT token
    const secretEnv = process.env.JWT_SECRET;
    if (!secretEnv) {
      return res.status(500).json({ error: "JWT secret not configured." });
    }
    const secret: Secret = secretEnv; // ensure type compatibility with jsonwebtoken

    const token = sign(
      {
        sub: chef.id, // Subject: Chef ID
        role: "chef",
        email: chef.email
      },
      secret,
      {
        expiresIn: getJwtExpiresInSeconds() // e.g., 604800 (7 days)
      }
    );

    // 5) Set JWT token in a secure HTTP-only cookie
    const isProd = process.env.NODE_ENV === "production";
    const sameSite =
      (process.env.COOKIE_SAMESITE as "lax" | "none" | "strict" | undefined) ??
      "lax";

    res.cookie(JWT_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProd || sameSite === "none", // required when SameSite=None
      sameSite,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/"
    });

    // 6) Send successful login response
    return res.status(200).json({
      message: "Logged in.",
      chef: {
        id: chef.id,
        email: chef.email,
        firstName: chef.firstName,
        lastName: chef.lastName
      }
    });
  } catch (err) {
    // Log unexpected errors
    console.error("LoginChefController error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
