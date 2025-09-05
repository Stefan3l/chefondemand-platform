-- CreateEnum
CREATE TYPE "public"."FoodType" AS ENUM ('CARNE', 'PESCE', 'VERDURA');

-- AlterTable
ALTER TABLE "public"."Dish" ADD COLUMN     "food_type" "public"."FoodType";
