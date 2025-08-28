
import { Router } from "express";
import { profileUpload } from "../../../lib/multer";
import { getProfile, upsertProfile, uploadProfilePhoto } from "../controllers/chefProfile.controller";
import { authJwtMiddleware } from "../../../middleware/authJwtMiddleware";

const router = Router({ mergeParams: true });

// Leggi profilo chef
router.get("/:chefId/profile", authJwtMiddleware, getProfile);

// Crea/aggiorna profilo (parziale, upsert)
router.patch("/:chefId/profile", authJwtMiddleware, upsertProfile);
router.put("/:chefId/profile", authJwtMiddleware, upsertProfile);

// Carica foto profilo (campo: "photo")
router.post("/:chefId/profile/photo", authJwtMiddleware, profileUpload.single("photo"), uploadProfilePhoto);

export default router;
