import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("Admin@123", 10); // apna password yahan dalen

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

  console.log("Admin created/updated:", admin);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
