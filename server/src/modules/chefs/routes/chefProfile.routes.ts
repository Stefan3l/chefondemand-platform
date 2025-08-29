import { Router } from "express";
import { profileUpload } from "../../../lib/multer";
import { authJwtMiddleware } from "../../../middleware/authJwtMiddleware";
import { getProfile, upsertProfile, patchProfile, uploadProfilePhoto } from "../controllers/chefProfile.controller";

const router = Router({ mergeParams: true });

// Leggi profilo chef
router.get("/:chefId/profile", authJwtMiddleware, getProfile);

// PATCH parziale (NON sovrascrive i campi assenti)
router.patch("/:chefId/profile", authJwtMiddleware, patchProfile);

// PUT completo (sostituzione coerente)
router.put("/:chefId/profile", authJwtMiddleware, upsertProfile);

// Carica foto profilo (campo: "photo")
router.post("/:chefId/profile/photo", authJwtMiddleware, profileUpload.single("photo"), uploadProfilePhoto);

export default router;
