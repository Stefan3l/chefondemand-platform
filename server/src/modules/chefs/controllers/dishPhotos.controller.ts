import { Request, Response, NextFunction } from "express";
import {
  chefIdParamSchema,
  photoIdParamSchema,
  listQuerySchema,
  createDishPhotoBodySchema,
  updateDishPhotoBodySchema,
} from "../validators/dishPhotos.validator";
import {
  listDishPhotosByChef,
  createDishPhoto,
  deleteDishPhoto,
  updateDishPhotoDescription,
} from "../services/dishPhotos.service";

// Wrapper async → cattura gli errori e li passa ad Express
export const asyncHandler =
  <T extends Request>(fn: (req: T, res: Response, next: NextFunction) => Promise<void>) =>
  (req: T, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);

// Funzione helper per normalizzare l'output delle foto
// - Garantisce che ogni record abbia un campo imageUrl
// - Se manca imageUrl in DB, viene derivato da imagePath
const toApiPhoto = (p: any) => {
  const safePath = p?.imagePath ? String(p.imagePath).replace(/^\/*/, "") : null;
  const derivedUrl = safePath ? `/static/${safePath}` : null;

  return {
    id: p.id,
    description: p.description ?? null,
    imagePath: p.imagePath ?? null, // es: "dishes/1756736465140-6i0in9.webp"
    imageUrl: p.imageUrl || derivedUrl, // es: "/static/dishes/1756736465140-6i0in9.webp"
    imageMime: p.imageMime ?? null,
    imageWidth: p.imageWidth ?? null,
    imageHeight: p.imageHeight ?? null,
    createdAt: p.createdAt,
  };
};

// GET /api/chefs/:chefId/dish-photos
// Restituisce la lista di foto per un determinato chef
export const getDishPhotos = asyncHandler(async (req, res) => {
  const { chefId } = chefIdParamSchema.parse(req.params);
  const { limit } = listQuerySchema.parse(req.query);

  const data = await listDishPhotosByChef(chefId, limit ?? 50);
  res.json({ ok: true, data: data.map(toApiPhoto) });
});

// POST /api/chefs/:chefId/dish-photos
// Crea una foto passando direttamente un imageUrl (es. già caricato su CDN)
export const postDishPhoto = asyncHandler(async (req, res) => {
  const { chefId } = chefIdParamSchema.parse(req.params);
  const body = createDishPhotoBodySchema.parse(req.body);

  const created = await createDishPhoto({
    chefId,
    imageUrl: body.imageUrl,
    imageMime: body.imageMime ?? null,
    description: body.description ?? null,
    imageWidth: body.imageWidth ?? null,
    imageHeight: body.imageHeight ?? null,
  });

  res.status(201).json({ ok: true, data: toApiPhoto(created) });
});

// PATCH /api/chefs/:chefId/dish-photos/:photoId
// Aggiorna solo la descrizione di una foto esistente
export const patchDishPhoto = asyncHandler(async (req, res) => {
  const { chefId } = chefIdParamSchema.parse(req.params);
  const { photoId } = photoIdParamSchema.parse(req.params);
  const body = updateDishPhotoBodySchema.parse(req.body);

  const updated = await updateDishPhotoDescription({
    chefId,
    photoId,
    description: body.description ?? null,
  });

  res.json({ ok: true, data: toApiPhoto(updated) });
});

// DELETE /api/chefs/:chefId/dish-photos/:photoId
// Elimina una foto (sia dal DB sia dal filesystem, se implementato nel service)
export const deleteDishPhotoById = asyncHandler(async (req, res) => {
  const { chefId } = chefIdParamSchema.parse(req.params);
  const { photoId } = photoIdParamSchema.parse(req.params);

  await deleteDishPhoto({ chefId, photoId });
  res.status(204).end();
});
