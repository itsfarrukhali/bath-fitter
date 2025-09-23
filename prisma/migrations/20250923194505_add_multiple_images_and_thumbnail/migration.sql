/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `TemplateVariant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."TemplateVariant" DROP COLUMN "imageUrl";

-- CreateTable
CREATE TABLE "public"."TemplateVariantImage" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "templateVariantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateVariantImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TemplateVariantImage_publicId_key" ON "public"."TemplateVariantImage"("publicId");

-- AddForeignKey
ALTER TABLE "public"."TemplateVariantImage" ADD CONSTRAINT "TemplateVariantImage_templateVariantId_fkey" FOREIGN KEY ("templateVariantId") REFERENCES "public"."TemplateVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
