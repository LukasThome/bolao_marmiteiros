import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const EMAIL = process.argv[2];

async function main() {
  if (!EMAIL) {
    console.error("Uso: npx tsx scripts/delete-user.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email: EMAIL } });

  if (!user) {
    console.error(`Usuário não encontrado: ${EMAIL}`);
    process.exit(1);
  }

  console.log(`Encontrado: ${user.name} (${user.email}) — id: ${user.id}`);

  await prisma.palpite.deleteMany({ where: { userId: user.id } });
  await prisma.bolaoMember.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });

  console.log("Conta deletada com sucesso.");
}

main().finally(() => prisma.$disconnect());
