// modules/chefs/menu-dishes/menuDish.service.ts
import { Prisma, PrismaClient, MenuDish, Dish, Menu } from "@prisma/client";

const prisma = new PrismaClient();

// ───────────────── Error HTTP semplice ─────────────────
class HttpError extends Error {
  public status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// ───────────────── Service per MenuDish ─────────────────
export class MenuDishService {
  // Verifica che il menu appartenga allo chef
  private async assertMenuOwnedByChef(chefId: string, menuId: string): Promise<Menu> {
    const menu = await prisma.menu.findFirst({ where: { id: menuId, chefId } });
    if (!menu) throw new HttpError(404, "Menu non trovato");
    return menu;
  }

  // Verifica che il piatto appartenga allo chef e restituisce i dati per lo snapshot
  private async getOwnedDishForSnapshot(chefId: string, dishId: string): Promise<Dish> {
    const dish = await prisma.dish.findFirst({
      where: { id: dishId, chefId },
    });
    if (!dish) throw new HttpError(404, "Piatto non trovato");
    return dish;
  }

  // Verifica che la riga appartenga allo chef e al menu
  private async getOwnedMenuDish(chefId: string, menuId: string, menuDishId: string): Promise<MenuDish> {
    const row = await prisma.menuDish.findFirst({ where: { id: menuDishId, chefId, menuId } });
    if (!row) throw new HttpError(404, "Riga menu non trovata");
    return row;
  }

  async listByMenu(chefId: string, menuId: string): Promise<MenuDish[]> {
    await this.assertMenuOwnedByChef(chefId, menuId);
    return prisma.menuDish.findMany({
      where: { chefId, menuId },
      orderBy: [{ ordine: "asc" }, { createdAt: "asc" }],
    });
  }

  async addDishToMenu(
    chefId: string,
    menuId: string,
    dishId: string,
    ordine?: number
  ): Promise<MenuDish> {
    await this.assertMenuOwnedByChef(chefId, menuId);
    const dish = await this.getOwnedDishForSnapshot(chefId, dishId);

    // Se non specificato, calcola l'ordine successivo
    let nextOrdine = ordine;
    if (nextOrdine === undefined) {
      const last = await prisma.menuDish.findFirst({
        where: { chefId, menuId },
        orderBy: [{ ordine: "desc" }, { createdAt: "desc" }],
        select: { ordine: true },
      });
      nextOrdine = (last?.ordine ?? 0) + 1;
    }

    try {
      return await prisma.menuDish.create({
        data: {
          chefId,
          menuId,
          dishId,
          categoria: dish.categoria,
          nomePiatto: dish.nomePiatto,
          descrizione: dish.descrizione ?? null,
          ordine: nextOrdine,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        // vincolo @@unique([menuId, dishId]) violato
        throw new HttpError(409, "Il piatto è già presente in questo menu");
      }
      throw err;
    }
  }

  async updateOne(
    chefId: string,
    menuId: string,
    menuDishId: string,
    data: { ordine?: number }
  ): Promise<MenuDish> {
    await this.assertMenuOwnedByChef(chefId, menuId);
    await this.getOwnedMenuDish(chefId, menuId, menuDishId);

    return prisma.menuDish.update({
      where: { id: menuDishId },
      data: {
        ...(data.ordine !== undefined ? { ordine: data.ordine } : {}),
      },
    });
  }

  async reorderBulk(
    chefId: string,
    menuId: string,
    items: Array<{ id: string; ordine: number }>
  ): Promise<MenuDish[]> {
    await this.assertMenuOwnedByChef(chefId, menuId);

    // Validazione appartenenza delle righe
    const ids = items.map((i) => i.id);
    const rows = await prisma.menuDish.findMany({
      where: { id: { in: ids }, chefId, menuId },
      select: { id: true },
    });
    if (rows.length !== ids.length) {
      throw new HttpError(400, "Sono presenti elementi non appartenenti al menu indicato");
    }

    await prisma.$transaction(
      items.map((i) =>
        prisma.menuDish.update({
          where: { id: i.id },
          data: { ordine: i.ordine },
        })
      )
    );

    return prisma.menuDish.findMany({
      where: { chefId, menuId },
      orderBy: [{ ordine: "asc" }, { createdAt: "asc" }],
    });
    }

  async remove(chefId: string, menuId: string, menuDishId: string): Promise<void> {
    await this.assertMenuOwnedByChef(chefId, menuId);
    await this.getOwnedMenuDish(chefId, menuId, menuDishId);
    await prisma.menuDish.delete({ where: { id: menuDishId } });
  }
}

export const menuDishService = new MenuDishService();
export { HttpError };
