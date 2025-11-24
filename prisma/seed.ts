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
