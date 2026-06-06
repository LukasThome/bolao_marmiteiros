import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "lucasthomedasilva@gmail.com" },
    update: {},
    create: {
      email: "lucasthomedasilva@gmail.com",
      name: "Lucas",
    },
  });
  console.log("✅ User created/updated:", user.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
