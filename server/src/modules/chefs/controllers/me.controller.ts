import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../../prisma";
import { AppError } from "../../../utils/AppError";

export async function MeChefController(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.sub as string | undefined;
    if (!userId) throw new AppError("Unauthorized", 401);

    const chef = await prisma.chef.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    if (!chef) throw new AppError("Chef non trovato.", 404);

    return res.status(200).json(chef);
  } catch (err) {
    next(err);
  }
}
