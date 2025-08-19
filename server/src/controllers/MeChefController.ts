
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function MeChefController(req: Request, res: Response) {
  try {
    // req.user trebuie să fie setat în middleware-ul de autentificare (de ex. authJwt)
    const userId = (req as any).user?.sub;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const chef = await prisma.chef.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!chef) {
      return res.status(404).json({ error: "Chef not found" });
    }

    return res.status(200).json(chef);
  } catch (err) {
    console.error("MeChefController error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
