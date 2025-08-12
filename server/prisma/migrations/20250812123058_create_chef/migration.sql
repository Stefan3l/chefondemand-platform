-- CreateTable
CREATE TABLE "public"."Chef" (
    "id" TEXT NOT NULL,
    "firstName" VARCHAR(60) NOT NULL,
    "lastName" VARCHAR(60) NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "phonePrefix" VARCHAR(8) NOT NULL,
    "phoneNumber" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chef_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Chef_email_key" ON "public"."Chef"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Chef_phonePrefix_phoneNumber_key" ON "public"."Chef"("phonePrefix", "phoneNumber");
