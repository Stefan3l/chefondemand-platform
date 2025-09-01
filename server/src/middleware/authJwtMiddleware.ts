// src/middleware/authJwtMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { verify, JwtPayload } from "jsonwebtoken";
import { JWT_COOKIE_NAME } from "../config/auth";

type AppJwtPayload = JwtPayload & {
  id?: string;
  sub?: string;
  chefId?: string;
  role?: "chef" | "admin" | "user";
  email?: string;
};

export function authJwtMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[JWT_COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "JWT secret not configured." });

  try {
    const decoded = verify(token, secret);
    if (typeof decoded === "string") {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    const p = decoded as AppJwtPayload;

    // normalizare: obținem un ID sigur din payload
    const normId = p.id ?? p.sub ?? p.chefId ?? "";
    if (!normId) return res.status(401).json({ error: "Invalid or expired token" });

    // populăm explicit req.user (tipurile rămân curate)
    req.user = {
      id: normId,
      chefId: p.chefId ?? p.id ?? p.sub, // poate fi undefined — e OK
      role: p.role,
      email: p.email,
    };

    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
