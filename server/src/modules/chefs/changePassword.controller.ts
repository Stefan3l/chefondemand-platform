import { Request, Response, NextFunction } from "express";
import { changeChefPassword } from "./changePassword.service";
import { AppError } from "../../utils/AppError";
import { ChangePasswordDTO } from "./password.policy";

export async function changePasswordController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user as { id?: string; sub?: string };
    const userId = user?.id || user?.sub;
    if (!userId) throw new AppError("Unauthorized", 401);

    const { oldPassword, newPassword } = req.body as ChangePasswordDTO;

    await changeChefPassword({ userId, oldPassword, newPassword });

    return res.status(200).json({ ok: true, message: "Password aggiornata con successo." });
  } catch (err) {
    next(err);
  }
}
