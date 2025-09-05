import { z } from "zod";
import { CuisineType, MenuBalance } from "@prisma/client";

/* Helpers URL: accetta http/https oppure path relativo servito da /static */
const isHttpOrStatic = (v: string) =>
  /^https?:\/\//i.test(v) || v.startsWith("/static/");

/* Non vogliamo mai salvare URL temporanei del browser */
const isForbiddenScheme = (v: string) =>
  v.startsWith("blob:") || v.startsWith("data:") || v.startsWith("file:") || v.startsWith("about:");

/* Accetta path reale su disco dentro uploads/, usato per delete fisico opzionale */
const isUploadsPath = (v: string) =>
  v.startsWith("uploads/") && !v.includes("..");

/* ───────── parametri ───────── */
export const chefIdParamSchema = z.object({
  chefId: z.string().min(1, "chefId mancante"),
});

export const menuIdParamSchema = z.object({
  menuId: z.string().min(1, "menuId mancante"),
});

/* ───────── campi immagine ─────────
   - stringa vuota → undefined
   - consente null per PATCH di rimozione
   - vieta 'blob:'/'data:' ecc.
   - imageUrl: http(s) OPPURE /static/...
   - imagePath: uploads/... (per uso interno lato server)
*/
const imageUrlSchema = z
  .union([z.string(), z.null()])
  .transform((v) => (v === "" ? undefined : v))
  .refine(
    (v) =>
      v === undefined ||
      v === null ||
      (typeof v === "string" && isHttpOrStatic(v) && !isForbiddenScheme(v)),
    { message: "imageUrl non valida" }
  )
  .optional();

const imagePathSchema = z
  .union([z.string(), z.null()])
  .transform((v) => (v === "" ? undefined : v))
  .refine(
    (v) =>
      v === undefined ||
      v === null ||
      (typeof v === "string" && isUploadsPath(v) && !isForbiddenScheme(v)),
    { message: "imagePath non valida" }
  )
  .optional();

/* ───────── create ───────── */
export const createMenuSchema = z.object({
  nome: z.string().min(1, "nome richiesto").max(120),

  descrizione: z
    .union([z.string(), z.literal("")])
    .transform((v) => (v === "" ? undefined : v))
    .refine((v) => v === undefined || (typeof v === "string" && v.length <= 500), {
      message: "descrizione troppo lunga",
    })
    .optional(),

  imageUrl: imageUrlSchema,
  imagePath: imagePathSchema,

  balance: z.nativeEnum(MenuBalance),

  cuisineTypes: z
    .array(z.nativeEnum(CuisineType))
    .max(3, "massimo 3 tipi di cucina")
    .optional()
    .default([]),
});

/* ───────── update (PATCH) ───────── */
export const updateMenuSchema = z.object({
  nome: z.string().min(1, "nome richiesto").max(120).optional(),

  descrizione: z
    .union([z.string(), z.literal("")])
    .transform((v) => (v === "" ? undefined : v))
    .refine((v) => v === undefined || (typeof v === "string" && v.length <= 500), {
      message: "descrizione troppo lunga",
    })
    .optional(),

  // permette anche null per rimozione immagine
  imageUrl: imageUrlSchema,
  imagePath: imagePathSchema,

  balance: z.nativeEnum(MenuBalance).optional(),

  cuisineTypes: z
    .array(z.nativeEnum(CuisineType))
    .max(3, "massimo 3 tipi di cucina")
    .optional(),
});

export type CreateMenuInput = z.infer<typeof createMenuSchema>;
export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;
