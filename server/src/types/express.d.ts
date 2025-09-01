// src/types/express.d.ts
import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      chefId?: string;
      role?: "chef" | "admin" | "user";
      email?: string;
    };
  }
}
