-- CreateTable
CREATE TABLE "public"."ChefProfile" (
    "id" TEXT NOT NULL,
    "chefId" TEXT NOT NULL,
    "profileImageUrl" VARCHAR(512),
    "profileImagePath" VARCHAR(512),
    "profileImageMime" VARCHAR(100),
    "bio" VARCHAR(240),
    "website" VARCHAR(255),
    "languages" TEXT[],
    "skills" TEXT[],
    "address" VARCHAR(255),
    "region" VARCHAR(100),
    "country" CHAR(2),
    "serviceRadiusKm" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChefProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChefProfile_chefId_key" ON "public"."ChefProfile"("chefId");

-- AddForeignKey
ALTER TABLE "public"."ChefProfile" ADD CONSTRAINT "ChefProfile_chefId_fkey" FOREIGN KEY ("chefId") REFERENCES "public"."Chef"("id") ON DELETE CASCADE ON UPDATE CASCADE;
