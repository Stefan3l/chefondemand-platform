// modules/chefs/menu/menu.validator.ts
import { z } from "zod";
import { CuisineType, MenuBalance } from "@prisma/client";

// ───────────────── Validazioni (Zod) ─────────────────
// Nota: niente `required_error` su `z.nativeEnum` per compatibilità con la tua versione di Zod.

export const chefIdParamSchema = z.object({
  chefId: z.string().min(1, "chefId mancante"),
});

export const menuIdParamSchema = z.object({
  menuId: z.string().min(1, "menuId mancante"),
});

export const createMenuSchema = z.object({
  // obbligatorio
  nome: z.string().min(1, "nome richiesto").max(120),

  // opzionale, stringa vuota → undefined
  descrizione: z
    .string()
    .max(500, "descrizione troppo lunga")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),

  // opzionale, valida URL; stringa vuota → undefined
  imageUrl: z
    .string()
    .url("imageUrl non valida")
    .max(512)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),

  // opzionale; stringa vuota → undefined
  imagePath: z
    .string()
    .max(512)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),

  // obbligatorio (nessun param di opzioni per evitare errori TS)
  balance: z.nativeEnum(MenuBalance),

  // massimo 3 tipi lato validazione
  cuisineTypes: z.array(z.nativeEnum(CuisineType)).max(3, "massimo 3 tipi di cucina").optional().default([]),
});

export const updateMenuSchema = z.object({
  // tutti opzionali per PATCH
  nome: z.string().min(1, "nome richiesto").max(120).optional(),

  descrizione: z
    .string()
    .max(500, "descrizione troppo lunga")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),

  imageUrl: z
    .string()
    .url("imageUrl non valida")
    .max(512)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),

  imagePath: z
    .string()
    .max(512)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),

  balance: z.nativeEnum(MenuBalance).optional(),

  cuisineTypes: z.array(z.nativeEnum(CuisineType)).max(3, "massimo 3 tipi di cucina").optional(),
});

export type CreateMenuInput = z.infer<typeof createMenuSchema>;
export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;
