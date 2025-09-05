import { PrismaClient, Menu, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

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

  async create(
    chefId: string,
    data: Prisma.MenuCreateInput | Prisma.MenuUncheckedCreateInput
  ): Promise<Menu> {
    return prisma.menu.create({
      data: {
        chefId,
        nome: data.nome as string,
        descrizione: (data as any).descrizione ?? undefined,
        imageUrl: (data as any).imageUrl ?? undefined,   // URL relativo /static/... o assoluto
        imagePath: (data as any).imagePath ?? undefined, // uploads/...
        balance: data.balance as any,
        cuisineTypes: (data as any).cuisineTypes ?? [],
      },
    });
  }

  async update(
    _chefId: string,
    menuId: string,
    data: Prisma.MenuUpdateInput | Prisma.MenuUncheckedUpdateInput
  ): Promise<Menu> {
    // ownership già verificata a livello controller
    return prisma.menu.update({
      where: { id: menuId },
      data,
    });
  }

  async remove(_chefId: string, menuId: string): Promise<void> {
    await prisma.menu.delete({ where: { id: menuId } });
  }

  async assertOwnedByChef(chefId: string, menuId: string): Promise<void> {
    const found = await prisma.menu.findFirst({
      where: { id: menuId, chefId },
      select: { id: true },
    });
    if (!found) {
      const err = new Error("Menu non trovato");
      (err as any).status = 404;
      throw err;
    }
  }
}

export const menuService = new MenuService();
