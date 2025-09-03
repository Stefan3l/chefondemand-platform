// modules/chefs/menu-dishes/menuDish.controller.ts
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import {
  chefAndMenuParamsSchema,
  menuDishIdParamSchema,
  addMenuDishSchema,
  updateMenuDishSchema,
  reorderMenuDishesSchema,
  AddMenuDishInput,
  UpdateMenuDishInput,
} from "../validators/menuDish.validator";
import { menuDishService, HttpError } from "../services/menuDish.service";

// ───────────────── Helper async ─────────────────
const asyncHandler =
  <T extends (req: Request, res: Response, next: NextFunction) => Promise<unknown>>(fn: T) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);

// ───────────────── Risposte ─────────────────
function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ ok: true, data });
}

// ───────────────── Controller ─────────────────

export const listMenuDishes = asyncHandler(async (req, res) => {
  const { chefId, menuId } = chefAndMenuParamsSchema.parse(req.params);
  const rows = await menuDishService.listByMenu(chefId, menuId);
  return ok(res, rows);
});

export const addMenuDish = asyncHandler(async (req, res) => {
  const { chefId, menuId } = chefAndMenuParamsSchema.parse(req.params);
  const body = addMenuDishSchema.parse(req.body) as AddMenuDishInput;

  const created = await menuDishService.addDishToMenu(chefId, menuId, body.dishId, body.ordine);
  return ok(res, created, 201);
});

export const updateMenuDish = asyncHandler(async (req, res) => {
  const { chefId, menuId } = chefAndMenuParamsSchema.parse(req.params);
  const { menuDishId } = menuDishIdParamSchema.parse(req.params);
  const body = updateMenuDishSchema.parse(req.body) as UpdateMenuDishInput;

  const updated = await menuDishService.updateOne(chefId, menuId, menuDishId, {
    ordine: body.ordine,
  });
  return ok(res, updated);
});

export const reorderMenuDishes = asyncHandler(async (req, res) => {
  const { chefId, menuId } = chefAndMenuParamsSchema.parse(req.params);
  const { items } = reorderMenuDishesSchema.parse(req.body);

  const updated = await menuDishService.reorderBulk(chefId, menuId, items);
  return ok(res, updated);
});

export const deleteMenuDish = asyncHandler(async (req, res) => {
  const { chefId, menuId } = chefAndMenuParamsSchema.parse(req.params);
  const { menuDishId } = menuDishIdParamSchema.parse(req.params);

  await menuDishService.remove(chefId, menuId, menuDishId);
  return res.status(204).send();
});

// ───────────────── Error handler specifico ─────────────────
export function menuDishErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof ZodError) {
    return res
      .status(400)
      .json({ ok: false, error: err.issues.map((i) => i.message).join("; ") });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ ok: false, error: err.message });
  }
  return next(err);
}
