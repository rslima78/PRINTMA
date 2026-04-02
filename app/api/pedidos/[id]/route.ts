import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { calcularPrazo } from "@/lib/utils";

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const pedido = await prisma.pedido.findUnique({ where: { id: params.id } });
    if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

    if (body.action === "prioridade") {
      const atualizado = await prisma.pedido.update({
        where: { id: params.id },
        data: { prioridade: !pedido.prioridade },
      });
      return NextResponse.json(atualizado);
    } else if (body.action === "status" && body.status) {
      const atualizado = await prisma.pedido.update({
        where: { id: params.id },
        data: { status: body.status },
      });
      await prisma.historicoStatus.create({
        data: {
          pedido_id: params.id,
          status_anterior: pedido.status,
          status_novo: body.status,
          alterado_por: (session.user as any).id,
        },
      });
      return NextResponse.json(atualizado);
    }
    return NextResponse.json({ error: "Ação PATCH inválida" }, { status: 400 });
  } catch (error) {
    console.error("Erro PATCH pedido:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    if (body.action === "reimprimir") {
      const { obs_reimpressao } = body;
      const original = await prisma.pedido.findUnique({
        where: { id: params.id },
        include: { turmas: true },
      });
      if (!original) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

      const novo = await prisma.pedido.create({
        data: {
          coordenador_id: original.coordenador_id,
          professor_id: original.professor_id,
          disciplina_id: original.disciplina_id,
          disciplina_nome: original.disciplina_nome,
          tipo_avaliacao: original.tipo_avaliacao,
          observacao: original.observacao,
          pdf_url: original.pdf_url,
          pdf_paginas: original.pdf_paginas,
          num_copias: original.num_copias,
          folhas_necessarias: original.folhas_necessarias,
          prazo: calcularPrazo(),
          status: "AGUARDANDO",
          prioridade: true,
          obs_reimpressao,
          turmas: {
            create: original.turmas.map((t) => ({
              turma_id: t.turma_id,
              turma_nome: t.turma_nome,
              num_estudantes: t.num_estudantes,
            })),
          },
        },
      });
      return NextResponse.json(novo, { status: 201 });
    }
    return NextResponse.json({ error: "Ação POST inválida" }, { status: 400 });
  } catch (error) {
    console.error("Erro POST pedido:", error);
    return NextResponse.json({ error: "Erro ao processar POST" }, { status: 500 });
  }
}
