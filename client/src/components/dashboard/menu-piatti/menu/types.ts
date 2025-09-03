export type DishCategory = "ANTIPASTO" | "PRIMO_PIATTO" | "PIATTO_PRINCIPALE" | "DESSERT" | "ALTRO";

export type Dish = {
  id: string;
  chefId: string;
  nomePiatto: string;
  categoria: DishCategory;
  descrizione: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiListResponse<T> = { ok: true; data: T };
export type ApiOneResponse<T> = { ok: true; data: T };
