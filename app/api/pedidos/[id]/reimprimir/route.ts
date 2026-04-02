import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { calcularFolhas, calcularPrazo } from "@/lib/utils";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { obs_reimpressao } = await req.json();
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
  } catch (error) {
    console.error("Erro reimprimir:", error);
    return NextResponse.json({ error: "Erro ao criar reimpressão" }, { status: 500 });
  }
}
