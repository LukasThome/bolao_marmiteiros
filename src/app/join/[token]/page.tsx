import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import JoinForm from "./JoinForm";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const bolao = await prisma.bolao.findUnique({ where: { inviteToken: token } });
  if (!bolao) redirect("/dashboard");

  const session = await auth();

  if (!session) {
    return <JoinForm token={token} bolaoName={bolao.name} />;
  }

  try {
    await prisma.bolaoMember.create({
      data: { userId: session.user.id, bolaoId: bolao.id },
    });
  } catch (e) {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) {
      throw e;
    }
  }

  redirect(`/boloes/${bolao.slug}`);
}
