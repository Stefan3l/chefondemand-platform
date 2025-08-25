
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadRoot = path.join(process.cwd(), "uploads", "profiles");

// Storage su disco: salva le foto in /uploads/profiles/:chefId/
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const chefId = (req.params as any).chefId || "common";
    const dir = path.join(uploadRoot, chefId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `profile_${ts}${ext}`);
  },
});

// Filtra i mime-type consentiti
function fileFilter(_req: any, file: Express.Multer.File, cb: any) {
  const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype);
  if (!ok) return cb(new Error("Tipo immagine non supportato. Usa jpg, png, webp o gif."));
  cb(null, true);
}

export const profileUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
});
