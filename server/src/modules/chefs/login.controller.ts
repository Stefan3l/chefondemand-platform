import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { sign, type Secret } from "jsonwebtoken";
import { prisma } from "../../prisma";
import { loginSchema } from "./login.schema";
import { AppError } from "../../utils/AppError";
import { JWT_COOKIE_NAME, getJwtExpiresInSeconds, getCookieSameSite } from "../../config/auth";

export async function LoginChefController(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Email o password non valida." });
    }
    const { email, password } = parsed.data;

    const chef = await prisma.chef.findUnique({
      where: { email },
      select: { id: true, email: true, firstName: true, lastName: true, passwordHash: true },
    });

    if (!chef) {
      return res.status(401).json({ error: "Email o password non valida." });
    }

    const ok = await bcrypt.compare(password, chef.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Email o password non valida." });
    }

    const secretEnv = process.env.JWT_SECRET;
    if (!secretEnv) throw new AppError("JWT secret non configurato.", 500);
    const secret: Secret = secretEnv;

    const token = sign(
      { sub: chef.id, role: "chef", email: chef.email },
      secret,
      { expiresIn: getJwtExpiresInSeconds() } // seconds
    );

    const isProd = process.env.NODE_ENV === "production";
    const sameSite = getCookieSameSite();

    res.cookie(JWT_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProd || sameSite === "none",
      sameSite,
      maxAge: getJwtExpiresInSeconds() * 1000,
      path: "/",
    });

    return res.status(200).json({
      message: "Logged in.",
      chef: { id: chef.id, email: chef.email, firstName: chef.firstName, lastName: chef.lastName },
    });
  } catch (err) {
    next(err);
  }
}
