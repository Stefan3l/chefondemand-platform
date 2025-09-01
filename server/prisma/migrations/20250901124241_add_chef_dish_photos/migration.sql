-- CreateTable
CREATE TABLE "public"."ChefDishPhoto" (
    "id" TEXT NOT NULL,
    "chefId" TEXT NOT NULL,
    "imageUrl" VARCHAR(512) NOT NULL,
    "imagePath" VARCHAR(512),
    "imageMime" VARCHAR(100),
    "imageWidth" INTEGER,
    "imageHeight" INTEGER,
    "description" VARCHAR(240),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChefDishPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_dishphoto_chefid" ON "public"."ChefDishPhoto"("chefId");

-- AddForeignKey
ALTER TABLE "public"."ChefDishPhoto" ADD CONSTRAINT "ChefDishPhoto_chefId_fkey" FOREIGN KEY ("chefId") REFERENCES "public"."Chef"("id") ON DELETE CASCADE ON UPDATE CASCADE;
