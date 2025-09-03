// modules/chefs/menu/menu.controller.ts
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { menuService } from "../services/menu.service";
import {
  chefIdParamSchema,
  menuIdParamSchema,
  createMenuSchema,
  updateMenuSchema,
  CreateMenuInput,
  UpdateMenuInput,
} from "../validators/menu.validator";

// ───────────────── Util: wrapper async ─────────────────
// Piccolo helper per propagare gli errori ad Express.
const asyncHandler =
  <T extends (req: Request, res: Response, next: NextFunction) => Promise<unknown>>(fn: T) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);

// ───────────────── Helpers risposta ─────────────────
function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ ok: true, data });
}

// ───────────────── Controller ─────────────────

export const listMenus = asyncHandler(async (req, res) => {
  const { chefId } = chefIdParamSchema.parse(req.params);
  const menus = await menuService.listByChef(chefId);
  return ok(res, menus);
});

export const getMenu = asyncHandler(async (req, res) => {
  const { chefId } = chefIdParamSchema.parse(req.params);
  const { menuId } = menuIdParamSchema.parse(req.params);
  const menu = await menuService.getOne(chefId, menuId);
  if (!menu) {
    return res.status(404).json({ ok: false, error: "Menu non trovato" });
  }
  return ok(res, menu);
});

export const createMenu = asyncHandler(async (req, res) => {
  const { chefId } = chefIdParamSchema.parse(req.params);
  const body = createMenuSchema.parse(req.body) as CreateMenuInput;

  // sicurezza: lunghezza array
  if (body.cuisineTypes && body.cuisineTypes.length > 3) {
    return res.status(400).json({ ok: false, error: "Massimo 3 tipi di cucina" });
  }

  const created = await menuService.create(chefId, {
    chefId,
    nome: body.nome,
    descrizione: body.descrizione,
    imageUrl: body.imageUrl,
    imagePath: body.imagePath,
    balance: body.balance,
    cuisineTypes: body.cuisineTypes ?? [],
  });

  return ok(res, created, 201);
});

export const updateMenu = asyncHandler(async (req, res) => {
  const { chefId } = chefIdParamSchema.parse(req.params);
  const { menuId } = menuIdParamSchema.parse(req.params);
  const body = updateMenuSchema.parse(req.body) as UpdateMenuInput;

  await menuService.assertOwnedByChef(chefId, menuId);

  if (body.cuisineTypes && body.cuisineTypes.length > 3) {
    return res.status(400).json({ ok: false, error: "Massimo 3 tipi di cucina" });
  }

  const updated = await menuService.update(chefId, menuId, {
    ...(body.nome !== undefined ? { nome: body.nome } : {}),
    ...(body.descrizione !== undefined ? { descrizione: body.descrizione } : {}),
    ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
    ...(body.imagePath !== undefined ? { imagePath: body.imagePath } : {}),
    ...(body.balance !== undefined ? { balance: body.balance } : {}),
    ...(body.cuisineTypes !== undefined ? { cuisineTypes: body.cuisineTypes } : {}),
  });

  return ok(res, updated);
});

export const deleteMenu = asyncHandler(async (req, res) => {
  const { chefId } = chefIdParamSchema.parse(req.params);
  const { menuId } = menuIdParamSchema.parse(req.params);

  await menuService.assertOwnedByChef(chefId, menuId);
  await menuService.remove(chefId, menuId);

  return res.status(204).send();
});

// ───────────────── Error handler Zod (facoltativo) ─────────────────
export function zodErrorHandler(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ ok: false, error: err.issues.map((i) => i.message).join("; ") });
  }
  return next(err);
}
