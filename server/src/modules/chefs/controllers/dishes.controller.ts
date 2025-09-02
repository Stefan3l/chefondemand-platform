// controllers/dishes.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  chefIdParamSchema,
  dishIdParamSchema,
  listQuerySchema,
  createDishBodySchema,
  updateDishBodySchema,
} from "../validators/dishes.validator";
import {
  listDishesByChef,
  createDish,
  deleteDish,
  updateDish,
  getDishById,
} from "../services/dishes.service";
import { DishCategory } from "@prisma/client";

/**
 * Wrapper async:
 * - accetta anche handler che non usano 'next'
 * - non impone Promise<void> (evita conflitti con rami che ritornano Response)
 */
export const asyncHandler =
  <T extends Request>(
    fn: (req: T, res: Response, next?: NextFunction) => Promise<any>
  ) =>
  (req: T, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Normalizzatore semplice per l'output API
const toApiDish = (d: any) => ({
  id: d.id,
  chefId: d.chefId,
  nomePiatto: d.nomePiatto,
  categoria: d.categoria, // enum DB
  descrizione: d.descrizione ?? null,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});

// GET /api/chefs/:chefId/dishes?category=...&limit=...
export const getDishes = asyncHandler(async (req, res) => {
  const { chefId } = chefIdParamSchema.parse(req.params);
  const { limit, category } = listQuerySchema.parse(req.query);

  const categoria = category ? (category as DishCategory) : null;
  const data = await listDishesByChef(chefId, { limit, categoria });

  res.json({ ok: true, data: data.map(toApiDish) });
});

// GET /api/chefs/:chefId/dishes/:dishId
export const getDish = asyncHandler(async (req, res) => {
  const { chefId } = chefIdParamSchema.parse(req.params);
  const { dishId } = dishIdParamSchema.parse(req.params);

  const d = await getDishById({ chefId, dishId });
  if (!d) {
    res.status(404).json({ ok: false, error: "Not found" });
    return;
  }
  res.json({ ok: true, data: toApiDish(d) });
});

// POST /api/chefs/:chefId/dishes
export const postDish = asyncHandler(async (req, res) => {
  const { chefId } = chefIdParamSchema.parse(req.params);
  const body = createDishBodySchema.parse(req.body);

  const created = await createDish({
    chefId,
    nomePiatto: body.nomePiatto,
    categoria: body.categoria as DishCategory,
    descrizione: body.descrizione ?? null,
  });

  res.status(201).json({ ok: true, data: toApiDish(created) });
});

// PATCH /api/chefs/:chefId/dishes/:dishId
export const patchDish = asyncHandler(async (req, res) => {
  const { chefId } = chefIdParamSchema.parse(req.params);
  const { dishId } = dishIdParamSchema.parse(req.params);
  const body = updateDishBodySchema.parse(req.body);

  const updated = await updateDish({
    chefId,
    dishId,
    nomePiatto: body.nomePiatto,
    categoria: body.categoria as DishCategory | undefined,
    descrizione: body.descrizione ?? undefined,
  });

  if (!updated) {
    res.status(404).json({ ok: false, error: "Not found" });
    return;
  }
  res.json({ ok: true, data: toApiDish(updated) });
});

// DELETE /api/chefs/:chefId/dishes/:dishId
export const deleteDishById = asyncHandler(async (req, res) => {
  const { chefId } = chefIdParamSchema.parse(req.params);
  const { dishId } = dishIdParamSchema.parse(req.params);

  const ok = await deleteDish({ chefId, dishId });
  if (!ok) {
    res.status(404).json({ ok: false, error: "Not found" });
    return;
  }
  res.status(204).end();
});
