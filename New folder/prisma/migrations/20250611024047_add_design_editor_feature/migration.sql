/*
  Warnings:

  - A unique constraint covering the columns `[cartId,productId,subdomain,userDesignId]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orderId,productId,subdomain,userDesignId]` on the table `OrderItem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "CartItem_cartId_productId_subdomain_key";

-- DropIndex
DROP INDEX "OrderItem_orderId_productId_subdomain_key";

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "userDesignId" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "userDesignId" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "designConfig" JSONB,
ADD COLUMN     "isDesignable" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "UserDesign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "designData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDesign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_subdomain_userDesignId_key" ON "CartItem"("cartId", "productId", "subdomain", "userDesignId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_orderId_productId_subdomain_userDesignId_key" ON "OrderItem"("orderId", "productId", "subdomain", "userDesignId");

-- AddForeignKey
ALTER TABLE "UserDesign" ADD CONSTRAINT "UserDesign_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_userDesignId_fkey" FOREIGN KEY ("userDesignId") REFERENCES "UserDesign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_userDesignId_fkey" FOREIGN KEY ("userDesignId") REFERENCES "UserDesign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
