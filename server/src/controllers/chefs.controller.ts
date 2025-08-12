import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma"; 
import { createChefSchema } from "../schemas/chef.schema";
import { ZodError } from "zod";

export async function registerChef(req: Request, res: Response, next: NextFunction) {
  try {
    // 1) Validate & normalize input
    const data = createChefSchema.parse(req.body);

    // 2) Enforce uniqueness (email & phone)
    const existingByEmail = await prisma.chef.findUnique({ where: { email: data.email } });
    if (existingByEmail) return res.status(409).json({ error: "Email already in use" });

    const existingByPhone = await prisma.chef.findFirst({
      where: { phonePrefix: data.phonePrefix, phoneNumber: data.phoneNumber }
    });
    if (existingByPhone) return res.status(409).json({ error: "Phone already in use" });

    // 3) Hash password (bcrypt)
    const passwordHash = await bcrypt.hash(data.password, 10);

    // 4) Create Chef record
    const chef = await prisma.chef.create({
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        countryCode: data.countryCode,
        phonePrefix: data.phonePrefix,
        phoneNumber: data.phoneNumber,
        email: data.email,
        passwordHash
      }
    });

    // 5) Return safe payload (omit passwordHash)
    const { passwordHash: _omit, ...safe } = chef;
    return res.status(201).json({ success: true, data: safe });
  } catch (err) {
    // Return proper 400 on validation error
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "Validation failed", details: err.flatten() });
    }
    return next(err);
  }
}
