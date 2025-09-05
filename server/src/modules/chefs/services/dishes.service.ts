// services/dishes.service.ts
import { PrismaClient, Dish, DishCategory, Prisma } from "@prisma/client";
import { FoodTypeApi } from "../validators/dishes.validator"; // Import corretto

const prisma = new PrismaClient();

/**
 * Lista i piatti di uno chef, con filtro categoria opzionale.
 * - limit: numero massimo di elementi (1..200, default 50)
 * - categoria: enum DishCategory oppure null (nessun filtro)
 */
export async function listDishesByChef(
  chefId: string,
  opts?: { limit?: number; categoria?: DishCategory | null }
): Promise<Dish[]> {
  const take = Math.min(Math.max(opts?.limit ?? 50, 1), 200);

  return prisma.dish.findMany({
    where: {
      chefId,
      ...(opts?.categoria ? { categoria: opts.categoria } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

/**
 * Crea un nuovo piatto per uno chef.
 */
export async function createDish(input: {
  chefId: string;
  nomePiatto: string;
  categoria: DishCategory;
  descrizione?: string | null;
  foodType: FoodTypeApi; // Usa i nuovi valori di FoodTypeApi
}): Promise<Dish> {
  const nome = input.nomePiatto.trim();
  const descr: string | null = input.descrizione?.trim() || null;

  return prisma.dish.create({
    data: {
      chefId: input.chefId,
      nomePiatto: nome,
      categoria: input.categoria,
      descrizione: descr,
      food_type: input.foodType, // Usa i nuovi valori di food_type
    },
  });
}

/**
 * Aggiorna un piatto esistente (solo se appartiene allo chef).
 * Ritorna null se non esiste o non appartiene allo chef.
 */
export async function updateDish(input: {
  chefId: string;
  dishId: string;
  nomePiatto?: string;
  categoria?: DishCategory;
  descrizione?: string | null;
  foodType?: FoodTypeApi; // Usa i nuovi valori di FoodTypeApi
}): Promise<Dish | null> {
  // Verifica ownership (lo chef deve essere proprietario del piatto)
  const exists = await prisma.dish.findFirst({
    where: { id: input.dishId, chefId: input.chefId },
  });
  if (!exists) return null;

  // Usa i tipi di Prisma per l'update input
  const data: Prisma.DishUpdateInput = {};

  if (typeof input.nomePiatto === "string") {
    data.nomePiatto = input.nomePiatto.trim();
  }
  if (typeof input.categoria !== "undefined") {
    data.categoria = input.categoria;
  }
  if (typeof input.descrizione !== "undefined") {
    const descr: string | null = input.descrizione?.trim() || null;
    data.descrizione = descr;
  }
  if (typeof input.foodType !== "undefined") {
    data.food_type = input.foodType; // Usa i nuovi valori di food_type
  }

  return prisma.dish.update({
    where: { id: input.dishId },
    data,
  });
}

/**
 * Elimina un piatto (solo se appartiene allo chef).
 * Ritorna true se eliminato, false se non trovato/non permesso.
 */
export async function deleteDish(input: {
  chefId: string;
  dishId: string;
}): Promise<boolean> {
  const exists = await prisma.dish.findFirst({
    where: { id: input.dishId, chefId: input.chefId },
  });
  if (!exists) return false;

  await prisma.dish.delete({ where: { id: input.dishId } });
  return true;
}

/**
 * Recupera un singolo piatto (con controllo owner).
 */
export async function getDishById(input: {
  chefId: string;
  dishId: string;
}): Promise<Dish | null> {
  return prisma.dish.findFirst({
    where: { id: input.dishId, chefId: input.chefId },
  });
}
