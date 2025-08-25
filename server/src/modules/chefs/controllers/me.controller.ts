// Tutto in ITA: ritorna Chef + Profile in un unico payload "safe"
import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../../prisma";
import { AppError } from "../../../utils/AppError";

export async function MeChefController(req: Request, res: Response, next: NextFunction) {
  try {
    // JWT → req.user.{id|sub}
    const user = (req as any).user as { id?: string; sub?: string } | undefined;
    const userId = user?.id || user?.sub;
    if (!userId) throw new AppError("Non autorizzato", 401);

    // Selezione "safe": nessuna passwordHash, nessun path interno immagine
    const chef = await prisma.chef.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        countryCode: true,
        phonePrefix: true,
        phoneNumber: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            id: true,
            chefId: true,
            profileImageUrl: true,
            profileImageMime: true,
            bio: true,
            website: true,
            languages: true,
            skills: true,
            address: true,
            region: true,
            country: true,
            serviceRadiusKm: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!chef) throw new AppError("Utente inesistente", 404);

    // Campi derivati utili per il frontend
    const fullName = `${chef.firstName} ${chef.lastName}`.trim();
    const phone = `${chef.phonePrefix}${chef.phoneNumber}`;

    return res.status(200).json({
      ok: true,
      data: {
        ...chef,
        fullName,
        phone,
      },
    });
  } catch (err) {
    next(err);
  }
}
