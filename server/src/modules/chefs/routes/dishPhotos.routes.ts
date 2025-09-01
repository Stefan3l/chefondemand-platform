import {
  Router,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import {
  getDishPhotos,
  postDishPhoto,
  patchDishPhoto,
  deleteDishPhotoById,
} from "../controllers/dishPhotos.controller";
import { authJwtMiddleware } from "../../../middleware/authJwtMiddleware";
import { ensureSameChefOrAdmin } from "../../../middleware/ownership.middleware";
import { createDishPhoto } from "../services/dishPhotos.service";

const router = Router();

/* ====================== ROTTE JSON ====================== */

// GET pubblico (o proteggilo se preferisci)
router.get("/chefs/:chefId/dish-photos", getDishPhotos);

// POST JSON (creazione con imageUrl)
router.post(
  "/chefs/:chefId/dish-photos",
  authJwtMiddleware,
  ensureSameChefOrAdmin("chefId"),
  postDishPhoto
);

// PATCH descrizione
router.patch(
  "/chefs/:chefId/dish-photos/:photoId",
  authJwtMiddleware,
  ensureSameChefOrAdmin("chefId"),
  patchDishPhoto
);

// DELETE foto
router.delete(
  "/chefs/:chefId/dish-photos/:photoId",
  authJwtMiddleware,
  ensureSameChefOrAdmin("chefId"),
  deleteDishPhotoById
);

/* ====================== UPLOAD MULTIPART ====================== */

// Assicura che la cartella esista
const dishesRoot = path.join(process.cwd(), "uploads", "dishes");
fs.mkdirSync(dishesRoot, { recursive: true });

// Storage su disco con nome unico
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, dishesRoot),
  filename: (_req, file, cb) => {
    const ext = (path.extname(file.originalname || "") || "").toLowerCase();
    const name = Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    cb(null, `${name}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if ((file.mimetype || "").startsWith("image/")) return cb(null, true);
    cb(new Error("Sono consentiti solo file immagine."));
  },
});

/** Wrapper Multer tipato: evita 'any' su req/res/next */
function multerSingleFile(fieldName: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.single(fieldName)(req, res, (err: unknown) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ ok: false, error: err.message });
      }
      return res.status(400).json({ ok: false, error: (err as Error).message });
    });
  };
}

/**
 * POST /api/chefs/:chefId/dish-photos/upload
 * multipart/form-data
 *  - file: (File) immagine (obbligatorio)
 *  - description: (Text, opzionale)
 */
router.post(
  "/chefs/:chefId/dish-photos/upload",
  authJwtMiddleware,
  ensureSameChefOrAdmin("chefId"),
  multerSingleFile("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { chefId } = req.params as { chefId: string };
      // Tip sicuro pentru 'file' adăugat de Multer
      const file = (req as Request & { file?: Express.Multer.File }).file;

      if (!file) {
        return res
          .status(400)
          .json({ ok: false, error: { message: 'Campo "file" mancante.' } });
      }

      // Path relativ sub /uploads (es. "dishes/abc.jpg")
      const rel = path
        .relative(path.join(process.cwd(), "uploads"), file.path)
        .replace(/\\/g, "/");

      // URL pubblico servito da /static (vedi app.ts)
      const publicPath = `/static/${rel}`; // es. /static/dishes/abc.jpg
      const absoluteUrl = `${req.protocol}://${req.get("host")}${publicPath}`;

      // Descrizione opzionale
      const descriptionRaw = (req.body?.description as string | undefined) ?? undefined;
      const description =
        typeof descriptionRaw === "string" && descriptionRaw.trim().length > 0
          ? descriptionRaw.trim()
          : undefined;

      // Salva record in DB (incluso imagePath per delete file)
      const created = await createDishPhoto({
        chefId,
        imageUrl: absoluteUrl,
        imageMime: file.mimetype ?? null,
        description: description ?? null,
        imageWidth: null,
        imageHeight: null,
        imagePath: rel, // importantissimo per cancellare il file in futuro
      });

      return res.status(201).json({ ok: true, data: created });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
