-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "designTemplateId" TEXT;

-- CreateTable
CREATE TABLE "DesignTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DesignTemplate_name_key" ON "DesignTemplate"("name");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_designTemplateId_fkey" FOREIGN KEY ("designTemplateId") REFERENCES "DesignTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
