import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = process.env.DEV_USER_EMAIL;

if (!email) {
  console.error("DEV_USER_EMAIL não definido no .env");
  process.exit(1);
}

const user = await prisma.user.update({
  where: { email },
  data: { role: "ADMIN" },
  select: { id: true, name: true, email: true, role: true },
});

console.log("Usuário promovido a ADMIN:", user);
await prisma.$disconnect();
