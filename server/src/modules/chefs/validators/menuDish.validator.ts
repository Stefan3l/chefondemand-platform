// modules/chefs/menu-dishes/menuDish.validator.ts
import { z } from "zod";

// ───────────────── Validazioni (Zod) ─────────────────

export const chefAndMenuParamsSchema = z.object({
  chefId: z.string().min(1, "chefId mancante"),
  menuId: z.string().min(1, "menuId mancante"),
});

export const menuDishIdParamSchema = z.object({
  menuDishId: z.string().min(1, "menuDishId mancante"),
});

export const addMenuDishSchema = z.object({
  dishId: z.string().min(1, "dishId richiesto"),
  ordine: z.number().int().min(0).optional(),
});

export const updateMenuDishSchema = z.object({
  ordine: z.number().int().min(0).optional(),
});

export const reorderMenuDishesSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1, "id riga richiesto"),
        ordine: z.number().int().min(0),
      })
    )
    .min(1, "almeno un elemento richiesto"),
});

export type AddMenuDishInput = z.infer<typeof addMenuDishSchema>;
export type UpdateMenuDishInput = z.infer<typeof updateMenuDishSchema>;
export type ReorderMenuDishesInput = z.infer<typeof reorderMenuDishesSchema>;
