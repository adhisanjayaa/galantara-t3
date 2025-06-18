/*
  Warnings:

  - You are about to drop the column `description` on the `ProductType` table. All the data in the column will be lost.
  - You are about to drop the column `formSchema` on the `ProductType` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `ProductType` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `ProductType` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ProductType_slug_key";

-- AlterTable
ALTER TABLE "ProductType" DROP COLUMN "description",
DROP COLUMN "formSchema",
DROP COLUMN "slug",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
