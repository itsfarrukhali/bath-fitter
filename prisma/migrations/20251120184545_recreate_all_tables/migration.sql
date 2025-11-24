-- CreateEnum
CREATE TYPE "PlumbingConfig" AS ENUM ('LEFT', 'RIGHT', 'BOTH');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "plumbingConfig" "PlumbingConfig" NOT NULL DEFAULT 'LEFT';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "plumbingConfig" "PlumbingConfig" NOT NULL DEFAULT 'LEFT';

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "plumbing_config" "PlumbingConfig";

-- AlterTable
ALTER TABLE "Subcategory" ADD COLUMN     "plumbingConfig" "PlumbingConfig" NOT NULL DEFAULT 'LEFT';

-- AlterTable
ALTER TABLE "TemplateVariant" ADD COLUMN     "plumbingConfig" "PlumbingConfig" NOT NULL DEFAULT 'LEFT';
