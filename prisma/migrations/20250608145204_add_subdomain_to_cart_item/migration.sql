/*
  Warnings:

  - A unique constraint covering the columns `[cartId,productId,subdomain]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "CartItem_cartId_productId_key";

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "subdomain" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_subdomain_key" ON "CartItem"("cartId", "productId", "subdomain");
