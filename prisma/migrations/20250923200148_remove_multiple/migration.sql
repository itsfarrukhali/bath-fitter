/*
  Warnings:

  - You are about to drop the `TemplateVariantImage` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `imageUrl` to the `TemplateVariant` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."TemplateVariantImage" DROP CONSTRAINT "TemplateVariantImage_templateVariantId_fkey";

-- AlterTable
ALTER TABLE "public"."TemplateVariant" ADD COLUMN     "imageUrl" TEXT NOT NULL,
ADD COLUMN     "publicId" TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- DropTable
DROP TABLE "public"."TemplateVariantImage";
