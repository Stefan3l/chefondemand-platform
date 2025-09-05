// validators/dishes.validator.ts
import { z } from "zod";

// Valori canonici per l'enum categoria usati nell'API/DB
export const DISH_CATEGORIES = [
  "ANTIPASTO",
  "PRIMO_PIATTO",
  "PIATTO_PRINCIPALE",
  "DESSERT",
  "ALTRO",
] as const;

export type DishCategoryApi = typeof DISH_CATEGORIES[number];

// Valori canonici per l'enum foodType usati nell'API/DB
export const FOOD_TYPES = ["CARNE", "VERDURA", "PESCE"] as const;

export type FoodTypeApi = typeof FOOD_TYPES[number];

// Parametri path: :chefId
export const chefIdParamSchema = z.object({
  chefId: z.string().min(1, "chefId mancante"),
});

// Parametri path: :dishId
export const dishIdParamSchema = z.object({
  dishId: z.string().min(1, "dishId mancante"),
});

// Querystring per la lista (limite + filtro categoria)
export const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
  category: z.enum(DISH_CATEGORIES).optional(),
});

// Corpo richiesta per CREATE
export const createDishBodySchema = z.object({
  nomePiatto: z.string().min(1).max(120),
  categoria: z.enum(DISH_CATEGORIES),
  descrizione: z.string().max(500).nullish(),
  foodType: z.enum(FOOD_TYPES), // Aggiunto foodType come campo obbligatorio
});

// Corpo richiesta per UPDATE (tutti opzionali)
export const updateDishBodySchema = z.object({
  nomePiatto: z.string().min(1).max(120).optional(),
  categoria: z.enum(DISH_CATEGORIES).optional(),
  descrizione: z.string().max(500).nullish().optional(),
  foodType: z.enum(FOOD_TYPES).optional(), // Aggiunto foodType come campo opzionale
});
