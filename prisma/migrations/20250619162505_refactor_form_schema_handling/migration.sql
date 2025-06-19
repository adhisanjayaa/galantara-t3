/*
  Warnings:

  - You are about to drop the column `formSchema` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "formSchema";

-- AlterTable
ALTER TABLE "ProductType" ADD COLUMN     "schemaIdentifier" TEXT;
