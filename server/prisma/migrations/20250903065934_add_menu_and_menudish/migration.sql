-- CreateEnum
CREATE TYPE "public"."MenuBalance" AS ENUM ('GUSTOSA', 'EQUILIBRATO', 'LEGGERA');

-- CreateEnum
CREATE TYPE "public"."CuisineType" AS ENUM ('LOCALE', 'GIAPPONESE', 'MEDITERRANEO', 'BBQ', 'FRUTTI_DI_MARE_PESCE', 'SALUTARE', 'FUSION', 'SORPRESA');

-- CreateTable
CREATE TABLE "public"."Menu" (
    "id" TEXT NOT NULL,
    "chefId" TEXT NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "descrizione" VARCHAR(500),
    "imageUrl" VARCHAR(512),
    "imagePath" VARCHAR(512),
    "balance" "public"."MenuBalance" NOT NULL,
    "cuisineTypes" "public"."CuisineType"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MenuDish" (
    "id" TEXT NOT NULL,
    "chefId" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "categoria" "public"."DishCategory" NOT NULL,
    "nomePiatto" VARCHAR(120) NOT NULL,
    "descrizione" VARCHAR(500),
    "ordine" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuDish_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_menu_chefid" ON "public"."Menu"("chefId");

-- CreateIndex
CREATE INDEX "idx_menudish_chefid" ON "public"."MenuDish"("chefId");

-- CreateIndex
CREATE INDEX "idx_menudish_menuid" ON "public"."MenuDish"("menuId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_menu_dish_once" ON "public"."MenuDish"("menuId", "dishId");

-- AddForeignKey
ALTER TABLE "public"."Menu" ADD CONSTRAINT "Menu_chefId_fkey" FOREIGN KEY ("chefId") REFERENCES "public"."Chef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MenuDish" ADD CONSTRAINT "MenuDish_chefId_fkey" FOREIGN KEY ("chefId") REFERENCES "public"."Chef"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MenuDish" ADD CONSTRAINT "MenuDish_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "public"."Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MenuDish" ADD CONSTRAINT "MenuDish_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "public"."Dish"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
