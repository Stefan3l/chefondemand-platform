// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient instance across hot-reloads in dev
export const prisma =
  (global as any).prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  (global as any).prisma = prisma;
}
