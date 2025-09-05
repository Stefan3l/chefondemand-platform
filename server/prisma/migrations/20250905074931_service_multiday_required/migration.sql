/*
  Warnings:

  - Made the column `serviceMultiDay` on table `ChefProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."ChefProfile" ALTER COLUMN "serviceMultiDay" SET NOT NULL;
