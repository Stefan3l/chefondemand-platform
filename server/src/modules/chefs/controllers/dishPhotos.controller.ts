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

// Wrapper per handler async → inoltra errori a Express
export const asyncHandler =
  <T extends Request>(fn: (req: T, res: Response, next: NextFunction) => Promise<void>) =>
  (req: T, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);

// GET /api/chefs/:chefId/dish-photos
export const getDishPhotos = asyncHandler(async (req, res) => {
  const { chefId } = chefIdParamSchema.parse(req.params);
  const { limit } = listQuerySchema.parse(req.query);

  const data = await listDishPhotosByChef(chefId, limit ?? 50);
  res.json({ ok: true, data });
});

// POST /api/chefs/:chefId/dish-photos
// Crea una foto passando un imageUrl (il file è già caricato su CDN/storage)
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

  res.status(201).json({ ok: true, data: created });
});

// PATCH /api/chefs/:chefId/dish-photos/:photoId
export const patchDishPhoto = asyncHandler(async (req, res) => {
  const { chefId } = chefIdParamSchema.parse(req.params);
  const { photoId } = photoIdParamSchema.parse(req.params);
  const body = updateDishPhotoBodySchema.parse(req.body);

  const updated = await updateDishPhotoDescription({
    chefId,
    photoId,
    description: body.description ?? null,
  });

  res.json({ ok: true, data: updated });
});

// DELETE /api/chefs/:chefId/dish-photos/:photoId
export const deleteDishPhotoById = asyncHandler(async (req, res) => {
  const { chefId } = chefIdParamSchema.parse(req.params);
  const { photoId } = photoIdParamSchema.parse(req.params);

  await deleteDishPhoto({ chefId, photoId });
  res.status(204).end();
});
