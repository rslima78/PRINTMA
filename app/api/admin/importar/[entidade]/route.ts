import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET - listar disciplinas, professores ou turmas
export async function GET(req: NextRequest, props: { params: Promise<{ entidade: string }> }) {
  try {
    const params = await props.params;
    const { entidade } = params;
    if (entidade === "disciplinas") {
      const items = await prisma.disciplina.findMany({ orderBy: { nome: "asc" } });
      return NextResponse.json(items);
    }
    if (entidade === "professores") {
      const items = await prisma.professor.findMany({ orderBy: { nome: "asc" } });
      return NextResponse.json(items);
    }
    if (entidade === "turmas") {
      const items = await prisma.turma.findMany({ orderBy: { nome: "asc" } });
      return NextResponse.json(items);
    }
    return NextResponse.json({ error: "Entidade inválida" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}

// POST - importar CSV ou adicionar item individual
export async function POST(req: NextRequest, props: { params: Promise<{ entidade: string }> }) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).perfil !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { entidade } = params;
    const body = await req.json();
    const items: any[] = body.items || [body];

    if (entidade === "disciplinas") {
      const result = await prisma.$transaction(
        items.map((item) =>
          prisma.disciplina.upsert({
            where: { nome: item.nome },
            update: {},
            create: { nome: item.nome },
          })
        )
      );
      return NextResponse.json({ count: result.length });
    }

    if (entidade === "professores") {
      const result = await prisma.$transaction(
        items.map((item) =>
          prisma.professor.create({ data: { nome: item.nome } })
        )
      );
      return NextResponse.json({ count: result.length });
    }

    if (entidade === "turmas") {
      const result = await prisma.$transaction(
        items.map((item) =>
          prisma.turma.create({
            data: { nome: item.nome, num_estudantes: parseInt(item.num_estudantes) },
          })
        )
      );
      return NextResponse.json({ count: result.length });
    }

    return NextResponse.json({ error: "Entidade inválida" }, { status: 400 });
  } catch (error: any) {
    console.error("Erro importar:", error);
    return NextResponse.json({ error: "Erro ao importar dados" }, { status: 500 });
  }
}

// DELETE - remover item
export async function DELETE(req: NextRequest, props: { params: Promise<{ entidade: string }> }) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).perfil !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { entidade } = params;
    const { id } = await req.json();

    if (entidade === "disciplinas") {
      await prisma.disciplina.delete({ where: { id } });
    } else if (entidade === "professores") {
      await prisma.professor.delete({ where: { id } });
    } else if (entidade === "turmas") {
      await prisma.turma.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === "P2003" || error.code === "P2014") {
      return NextResponse.json({ error: "Não é possível excluir: existem associações" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}
