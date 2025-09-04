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
const asyncHandler =
  <T extends (req: Request, res: Response, next: NextFunction) => Promise<unknown>>(fn: T) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);

// ───────────────── Helpers risposta ─────────────────
function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ ok: true, data });
}

// Piccola rete di sicurezza: rimuove valori blob:/data:/file:
function sanitizeImageFields<T extends { imageUrl?: string | null; imagePath?: string | null }>(body: T) {
  const safe = { ...body };
  const bad = (v?: string | null) =>
    typeof v === "string" &&
    (v.startsWith("blob:") || v.startsWith("data:") || v.startsWith("file:") || v.startsWith("about:"));

  if (bad(safe.imageUrl)) safe.imageUrl = undefined as any;
  if (bad(safe.imagePath)) safe.imagePath = undefined as any;
  return safe;
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
  const parsed = createMenuSchema.parse(req.body) as CreateMenuInput;
  const body = sanitizeImageFields(parsed);

  // sicurezza: lunghezza array
  if (body.cuisineTypes && body.cuisineTypes.length > 3) {
    return res.status(400).json({ ok: false, error: "Massimo 3 tipi di cucina" });
  }

  const created = await menuService.create(chefId, {
    chefId,
    nome: body.nome,
    descrizione: body.descrizione,
    imageUrl: body.imageUrl ?? null,
    imagePath: body.imagePath ?? null,
    balance: body.balance,
    cuisineTypes: body.cuisineTypes ?? [],
  });

  return ok(res, created, 201);
});

export const updateMenu = asyncHandler(async (req, res) => {
  const { chefId } = chefIdParamSchema.parse(req.params);
  const { menuId } = menuIdParamSchema.parse(req.params);
  await menuService.assertOwnedByChef(chefId, menuId);

  const parsed = updateMenuSchema.parse(req.body) as UpdateMenuInput;
  const body = sanitizeImageFields(parsed);

  if (body.cuisineTypes && body.cuisineTypes.length > 3) {
    return res.status(400).json({ ok: false, error: "Massimo 3 tipi di cucina" });
  }

  const updated = await menuService.update(chefId, menuId, {
    ...(body.nome !== undefined ? { nome: body.nome } : {}),
    ...(body.descrizione !== undefined ? { descrizione: body.descrizione } : {}),
    // Consente anche null: usato per cancellare immagine (set NULL in DB)
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
