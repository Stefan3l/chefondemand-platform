import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../../../utils/AppError";
import { updateChefSchema } from "../validators/chef.update.schema";
import { updateChefAccountById } from "../services/chef.service";


function assertSameUserOrThrow(req: Request, chefId: string) {
  const user = (req as any).user as { id?: string; sub?: string } | undefined;
  const userId = user?.id || user?.sub;
  if (!userId) throw new AppError("Non autorizzato", 401);
  if (userId !== chefId) throw new AppError("Accesso negato", 403);
}


export async function PatchChefAccountController(req: Request, res: Response, next: NextFunction) {
  try {
    const { chefId } = req.params;
    assertSameUserOrThrow(req, chefId);

  
    const parsed = updateChefSchema.parse(req.body);

    const updated = await updateChefAccountById(chefId, parsed);
    return res.json({ ok: true, data: updated });
  } catch (err: any) {
  
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = (err.meta?.target as string[]) || [];
     
      if (target.includes("email")) {
        return res.status(409).json({ ok: false, message: "Email già in uso da un altro account" });
      }
      if (target.includes("Chef_phonePrefix_phoneNumber_key")) {
        return res.status(409).json({ ok: false, message: "Telefono già in uso da un altro account" });
      }
      return res.status(409).json({ ok: false, message: "Dato già in uso da un altro account" });
    }
    return next(err);
  }
}
