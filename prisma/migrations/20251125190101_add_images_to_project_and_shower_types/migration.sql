/*
  Warnings:

  - You are about to drop the column `baseImage` on the `ShowerType` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProjectType" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "ShowerType" DROP COLUMN "baseImage",
ADD COLUMN     "baseImageLeft" TEXT,
ADD COLUMN     "baseImageRight" TEXT,
ADD COLUMN     "imageUrl" TEXT;
