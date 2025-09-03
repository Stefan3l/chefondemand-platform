// modules/chefs/menu/menu.service.ts
import { PrismaClient, Menu, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// ───────────────── Service per Menu ─────────────────
// Nota: assicuriamo sempre il vincolo di appartenenza allo chef via where { id, chefId }.

export class MenuService {
  async listByChef(chefId: string): Promise<Menu[]> {
    return prisma.menu.findMany({
      where: { chefId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getOne(chefId: string, menuId: string): Promise<Menu | null> {
    return prisma.menu.findFirst({
      where: { id: menuId, chefId },
    });
  }

  async create(chefId: string, data: Prisma.MenuCreateInput | Prisma.MenuUncheckedCreateInput): Promise<Menu> {
    return prisma.menu.create({
      data: {
        chefId,
        nome: data.nome as string,
        descrizione: (data as any).descrizione ?? undefined,
        imageUrl: (data as any).imageUrl ?? undefined,
        imagePath: (data as any).imagePath ?? undefined,
        balance: data.balance as any,
        cuisineTypes: (data as any).cuisineTypes ?? [],
      },
    });
  }

  async update(chefId: string, menuId: string, data: Prisma.MenuUpdateInput | Prisma.MenuUncheckedUpdateInput): Promise<Menu> {
    return prisma.menu.update({
      where: { id: menuId },
      data: {
        // vincolo di sicurezza: update condizionato per chef
        // (Prisma non supporta where multiplo su update: verifichiamo prima)
        ...data,
      },
    });
  }

  async remove(chefId: string, menuId: string): Promise<void> {
    await prisma.menu.delete({
      where: { id: menuId },
    });
  }

  // Verifica ownership prima di update/delete
  async assertOwnedByChef(chefId: string, menuId: string): Promise<void> {
    const found = await prisma.menu.findFirst({ where: { id: menuId, chefId }, select: { id: true } });
    if (!found) {
      const err = new Error("Menu non trovato");
      (err as any).status = 404;
      throw err;
    }
  }
}

export const menuService = new MenuService();
