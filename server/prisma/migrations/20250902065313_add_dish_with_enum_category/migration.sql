-- CreateEnum
CREATE TYPE "public"."DishCategory" AS ENUM ('ANTIPASTO', 'PRIMO_PIATTO', 'PIATTO_PRINCIPALE', 'DESSERT', 'ALTRO');

-- CreateTable
CREATE TABLE "public"."Dish" (
    "id" TEXT NOT NULL,
    "chefId" TEXT NOT NULL,
    "nomePiatto" VARCHAR(120) NOT NULL,
    "categoria" "public"."DishCategory" NOT NULL,
    "descrizione" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dish_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_dish_chefid" ON "public"."Dish"("chefId");

-- AddForeignKey
ALTER TABLE "public"."Dish" ADD CONSTRAINT "Dish_chefId_fkey" FOREIGN KEY ("chefId") REFERENCES "public"."Chef"("id") ON DELETE CASCADE ON UPDATE CASCADE;
