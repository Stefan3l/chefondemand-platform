// src/types/jwt.ts
import type { JwtPayload } from "jsonwebtoken";

/** Payload applicativo: include chefId opzionale */
export interface AppJwtPayload extends JwtPayload {
  id?: string;                 
  sub?: string;
  chefId?: string;            
  role?: "chef" | "admin" | "user";
  email?: string;
}
