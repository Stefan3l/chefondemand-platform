import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import { JWT_COOKIE_NAME } from "../config/auth";

export function authJwtMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies[JWT_COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: "JWT secret not configured." });

    const decoded = verify(token, secret) as Request["user"];
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
