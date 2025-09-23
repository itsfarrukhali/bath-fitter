import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // 🔑 Admin user create/update
  const hashedPassword = await bcrypt.hash("Admin@123", 10);

  const admin = await prisma.admin.upsert({
    where: { email: "admin@bathfitter.com" },
    update: {},
    create: {
      fullName: "Super Admin",
      email: "admin@bathfitter.com",
      username: "admin",
      password: hashedPassword,
    },
  });

  console.log("✅ Admin created/updated:", admin);

  // 🏷️ Template Category
  const templateCategory = await prisma.templateCategory.create({
    data: {
      name: "Shower Walls",
      slug: "shower-walls",
      description: "Template for shower wall categories",
    },
  });

  // 🏷️ Template Subcategory
  const templateSubcategory = await prisma.templateSubcategory.create({
    data: {
      name: "Wall Panels",
      slug: "wall-panels",
      templateCategoryId: templateCategory.id,
    },
  });

  // 🛒 Template Product
  const templateProduct = await prisma.templateProduct.create({
    data: {
      name: "Genova Wall Panel",
      slug: "genova-wall-panel",
      templateSubcategoryId: templateSubcategory.id,
    },
  });

  // 🎨 Template Variants
  await prisma.templateVariant.createMany({
    data: [
      {
        colorName: "White Marble",
        colorCode: "#FFFFFF",
        imageUrl: "https://cloudinary.com/genova-white.png",
        templateProductId: templateProduct.id,
      },
      {
        colorName: "Cream",
        colorCode: "#F5F5DC",
        imageUrl: "https://cloudinary.com/genova-cream.png",
        templateProductId: templateProduct.id,
      },
    ],
  });

  console.log("✅ Template seeded successfully!");
}

// 🚀 Run main
main()
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
