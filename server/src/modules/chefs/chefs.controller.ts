// src/modules/chefs/chefs.controller.ts
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../../prisma";
import { createChefSchema } from "./chef.schema";
import { ZodError } from "zod";
import { AppError } from "../../utils/AppError";

// Registrazione chef
export async function registerChef(req: Request, res: Response, next: NextFunction) {
  try {
    // 1) Validazione & normalizzazione input
    const data = createChefSchema.parse(req.body);
    const email = data.email.toLowerCase().trim();

    // 2) Unicità (email & telefono)
    const existingByEmail = await prisma.chef.findUnique({ where: { email } });
    if (existingByEmail) throw new AppError("Email già in uso.", 409);

    const existingByPhone = await prisma.chef.findFirst({
      where: { phonePrefix: data.phonePrefix, phoneNumber: data.phoneNumber }
    });
    if (existingByPhone) throw new AppError("Numero di telefono già in uso.", 409);

    // 3) Hash password (bcrypt)
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // 4) Crea record Chef
    const chef = await prisma.chef.create({
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        countryCode: data.countryCode,
        phonePrefix: data.phonePrefix,
        phoneNumber: data.phoneNumber,
        email,
        passwordHash
      }
    });

    // 5) Payload sicuro (omette passwordHash)
    const { passwordHash: _omit, ...safe } = chef;
    return res.status(201).json({ ok: true, data: safe });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(422).json({ error: "Validazione fallita.", details: err.flatten() });
    }
    next(err);
  }
}
