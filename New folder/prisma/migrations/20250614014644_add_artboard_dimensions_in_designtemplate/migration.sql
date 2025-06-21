/*
  Warnings:

  - You are about to drop the column `artboardHeight` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `artboardWidth` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DesignTemplate" ADD COLUMN     "artboardHeight" INTEGER,
ADD COLUMN     "artboardWidth" INTEGER;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "artboardHeight",
DROP COLUMN "artboardWidth";
