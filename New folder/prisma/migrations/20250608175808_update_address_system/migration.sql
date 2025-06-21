/*
  Warnings:

  - A unique constraint covering the columns `[userId,type]` on the table `Address` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `type` to the `Address` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('PRIMARY', 'SECONDARY');

-- DropIndex
DROP INDEX "Address_userId_key";

-- AlterTable
ALTER TABLE "Address" ADD COLUMN     "type" "AddressType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Address_userId_type_key" ON "Address"("userId", "type");
