-- AlterTable
ALTER TABLE "DesignTemplate" ALTER COLUMN "designData" SET DEFAULT '[]',
ALTER COLUMN "designData" SET DATA TYPE JSONB[] USING ARRAY["designData"];

-- AlterTable
ALTER TABLE "UserDesign" ALTER COLUMN "designData" SET DEFAULT '[]',
ALTER COLUMN "designData" SET DATA TYPE JSONB[] USING ARRAY["designData"];