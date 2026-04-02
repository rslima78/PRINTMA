import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const associacoes = await prisma.associacao.findMany({
      include: {
        professor: true,
        disciplina: true,
        turmas: { include: { turma: true } },
      },
      orderBy: { professor: { nome: "asc" } },
    });
    return NextResponse.json(associacoes);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar associações" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).perfil !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { professor_id, disciplina_id, turma_ids } = await req.json();

    const associacao = await prisma.associacao.create({
      data: {
        professor_id,
        disciplina_id,
        turmas: {
          create: turma_ids.map((turma_id: string) => ({ turma_id })),
        },
      },
      include: {
        professor: true,
        disciplina: true,
        turmas: { include: { turma: true } },
      },
    });

    return NextResponse.json(associacao, { status: 201 });
  } catch (error) {
    console.error("Erro criar associação:", error);
    return NextResponse.json({ error: "Erro ao criar associação" }, { status: 500 });
  }
}
