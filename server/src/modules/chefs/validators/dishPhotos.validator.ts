
import { z } from "zod";

// Parametri di path: chefId e photoId sono cuid() string
export const chefIdParamSchema = z.object({
  chefId: z.string().min(1, "chefId richiesto"),
});

export const photoIdParamSchema = z.object({
  photoId: z.string().min(1, "photoId richiesto"),
});

// Query per lista (facoltativa: pagination semplice)
export const listQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .refine((v) => v === undefined || (Number.isInteger(v) && v > 0 && v <= 100), {
      message: "limit deve essere un intero 1..100",
    }),
});

// Body per creazione foto
export const createDishPhotoBodySchema = z.object({
  imageUrl: z.string().url("imageUrl deve essere un URL valido"),
  imageMime: z.string().min(1).max(100).optional(),
  description: z.string().max(240).optional(),
  imageWidth: z.number().int().positive().optional(),
  imageHeight: z.number().int().positive().optional(),
});

// Body per update (solo descrizione, opzionale/null → la rimuove)
export const updateDishPhotoBodySchema = z.object({
  description: z
    .union([z.string().max(240), z.null()])
    .optional(),
});

export type CreateDishPhotoBody = z.infer<typeof createDishPhotoBodySchema>;
export type UpdateDishPhotoBody = z.infer<typeof updateDishPhotoBodySchema>;
