/*
  Warnings:

  - The `designData` column on the `DesignTemplate` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `designData` column on the `UserDesign` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "DesignTemplate" DROP COLUMN "designData",
ADD COLUMN     "designData" JSONB[] DEFAULT ARRAY[]::JSONB[];

-- AlterTable
ALTER TABLE "UserDesign" DROP COLUMN "designData",
ADD COLUMN     "designData" JSONB[] DEFAULT ARRAY[]::JSONB[];

-- CreateTable
CREATE TABLE "CustomFont" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFont_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomFont_url_key" ON "CustomFont"("url");
