-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BorrowStatus" ADD VALUE 'VALIDATED';
ALTER TYPE "BorrowStatus" ADD VALUE 'REJECTED';

-- CreateTable
CREATE TABLE "ProductValidation" (
    "id" TEXT NOT NULL,
    "borrowId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "isValid" BOOLEAN NOT NULL,
    "expectedProduct" TEXT NOT NULL,
    "detectedProduct" TEXT,
    "confidence" DOUBLE PRECISION,
    "allDetections" JSONB,
    "imagePath" TEXT,
    "validatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductValidation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductValidation_borrowId_idx" ON "ProductValidation"("borrowId");

-- CreateIndex
CREATE INDEX "ProductValidation_toolId_idx" ON "ProductValidation"("toolId");

-- AddForeignKey
ALTER TABLE "ProductValidation" ADD CONSTRAINT "ProductValidation_borrowId_fkey" FOREIGN KEY ("borrowId") REFERENCES "Borrow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductValidation" ADD CONSTRAINT "ProductValidation_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
