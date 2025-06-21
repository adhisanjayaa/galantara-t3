/*
  Warnings:

  - A unique constraint covering the columns `[trackingId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ShippingStatus" AS ENUM ('PROCESSING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELED', 'RETURNED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingStatus" "ShippingStatus",
ADD COLUMN     "trackingId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_trackingId_key" ON "Order"("trackingId");
