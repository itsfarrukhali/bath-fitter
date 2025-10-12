-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Admin" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "selections" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShowerType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "projectTypeId" INTEGER NOT NULL,
    "baseImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShowerType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TemplateCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TemplateSubcategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "templateCategoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateSubcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TemplateProduct" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "templateCategoryId" INTEGER,
    "templateSubcategoryId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "thumbnailUrl" TEXT,

    CONSTRAINT "TemplateProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TemplateVariant" (
    "id" SERIAL NOT NULL,
    "colorName" TEXT NOT NULL,
    "colorCode" TEXT,
    "templateProductId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "publicId" TEXT,

    CONSTRAINT "TemplateVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "hasSubcategories" BOOLEAN NOT NULL DEFAULT false,
    "showerTypeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "templateId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "z_index" INTEGER DEFAULT 50,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subcategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "templateId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "z_index" INTEGER DEFAULT 50,

    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "subcategoryId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slug" TEXT NOT NULL,
    "templateId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "z_index" INTEGER DEFAULT 50,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductVariant" (
    "id" SERIAL NOT NULL,
    "colorName" TEXT NOT NULL,
    "colorCode" TEXT,
    "imageUrl" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "templateVariantId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publicId" TEXT,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserDesign" (
    "id" SERIAL NOT NULL,
    "userFullName" TEXT,
    "userEmail" TEXT,
    "userPhone" TEXT,
    "userPostalCode" TEXT,
    "designData" JSONB NOT NULL,
    "showerTypeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDesign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "public"."Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "public"."Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectType_slug_key" ON "public"."ProjectType"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ShowerType_slug_key" ON "public"."ShowerType"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateCategory_slug_key" ON "public"."TemplateCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateSubcategory_templateCategoryId_slug_key" ON "public"."TemplateSubcategory"("templateCategoryId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_showerTypeId_slug_key" ON "public"."Category"("showerTypeId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Subcategory_categoryId_slug_key" ON "public"."Subcategory"("categoryId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_categoryId_slug_key" ON "public"."Product"("categoryId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_subcategoryId_slug_key" ON "public"."Product"("subcategoryId", "slug");

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShowerType" ADD CONSTRAINT "ShowerType_projectTypeId_fkey" FOREIGN KEY ("projectTypeId") REFERENCES "public"."ProjectType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TemplateSubcategory" ADD CONSTRAINT "TemplateSubcategory_templateCategoryId_fkey" FOREIGN KEY ("templateCategoryId") REFERENCES "public"."TemplateCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TemplateProduct" ADD CONSTRAINT "TemplateProduct_templateCategoryId_fkey" FOREIGN KEY ("templateCategoryId") REFERENCES "public"."TemplateCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TemplateProduct" ADD CONSTRAINT "TemplateProduct_templateSubcategoryId_fkey" FOREIGN KEY ("templateSubcategoryId") REFERENCES "public"."TemplateSubcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TemplateVariant" ADD CONSTRAINT "TemplateVariant_templateProductId_fkey" FOREIGN KEY ("templateProductId") REFERENCES "public"."TemplateProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Category" ADD CONSTRAINT "Category_showerTypeId_fkey" FOREIGN KEY ("showerTypeId") REFERENCES "public"."ShowerType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Category" ADD CONSTRAINT "Category_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."TemplateCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subcategory" ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subcategory" ADD CONSTRAINT "Subcategory_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."TemplateSubcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "public"."Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."TemplateProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductVariant" ADD CONSTRAINT "ProductVariant_templateVariantId_fkey" FOREIGN KEY ("templateVariantId") REFERENCES "public"."TemplateVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserDesign" ADD CONSTRAINT "UserDesign_showerTypeId_fkey" FOREIGN KEY ("showerTypeId") REFERENCES "public"."ShowerType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
