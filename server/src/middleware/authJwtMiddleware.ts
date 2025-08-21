
import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";

const JWT_COOKIE_NAME = "chef_access_token";

export function authJwtMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies[JWT_COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const secret = process.env.JWT_SECRET;
    const decoded = verify(token, secret!);
  
    (req as any).user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
