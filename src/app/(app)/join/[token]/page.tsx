import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();

  const bolao = await prisma.bolao.findUnique({ where: { inviteToken: token } });
  if (!bolao) redirect("/dashboard");

  try {
    await prisma.bolaoMember.create({
      data: { userId: session!.user.id, bolaoId: bolao.id },
    });
  } catch (e) {
    // P2002 = já é membro, tudo certo
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) {
      throw e;
    }
  }

  redirect(`/boloes/${bolao.slug}`);
}
