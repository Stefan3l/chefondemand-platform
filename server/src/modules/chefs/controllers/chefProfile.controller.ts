import fs from "fs/promises";
import { Request, Response, NextFunction } from "express";
import path from "path";
import { AppError } from "../../../utils/AppError";
import { chefProfileSchema } from "../validators";
import * as profileService from "../services/chefProfile.service";

// TODO: sostituire con auth reale (JWT). Verifica che l'utente sia il proprietario del profilo.
function assertSameUserOrThrow(req: Request, chefId: string) {
  const user = (req as any).user as { id?: string; sub?: string } | undefined;
  const userId = user?.id || user?.sub;
  if (!userId) throw new AppError("Non autorizzato", 401);
  if (userId !== chefId) throw new AppError("Accesso negato", 403);
}

/**
 * GET /api/chefs/:chefId/profile
 * Ritorna il profilo dello chef (404 se non esiste).
 */
export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { chefId } = req.params;
    // assertSameUserOrThrow(req, chefId); // attiva quando hai l'auth pronta

    const profile = await profileService.getByChefId(chefId);
    if (!profile) return res.status(404).json({ ok: false, message: "Profilo inesistente" });

    res.json({ ok: true, data: profile });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/chefs/:chefId/profile
 * Crea/aggiorna parzialmente il profilo (upsert).
 */
export async function upsertProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { chefId } = req.params;
    assertSameUserOrThrow(req, chefId);

    // Validazione in ITA (schema gestisce anche "" -> undefined per website)
    const parsed = chefProfileSchema.parse(req.body);
    const result = await profileService.upsertByChefId(chefId, parsed);

    res.json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/chefs/:chefId/profile/photo
 * Carica/sostituisce la foto profilo (campo form-data: "photo").
 */
export async function uploadProfilePhoto(req: Request, res: Response, next: NextFunction) {
  let uploadedPath: string | undefined;
  try {
    const { chefId } = req.params;
    assertSameUserOrThrow(req, chefId);

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) throw new AppError("Immagine mancante", 400);

    uploadedPath = file.path; // per cleanup in caso di errore successivo

    const rel = path.join("profiles", chefId, file.filename).replace(/\\/g, "/");
    const publicUrl = `/static/${rel}`;

    // service ritorna un profilo "safe" (senza path interno)
    const profile = await profileService.setProfilePhoto(chefId, {
      url: publicUrl,
      path: file.path,
      mime: file.mimetype,
    });

    return res.json({
      ok: true,
      message: "Foto profilo aggiornata",
      data: profile, // oggetto safe
    });
  } catch (err) {
    // se qualcosa fallisce dopo che Multer ha scritto il file, rimuovi il nuovo file
    if (uploadedPath) {
      try {
        await fs.unlink(uploadedPath);
      } catch {
        // ignora ENOENT / errori minori
      }
    }
    next(err);
  }
}
