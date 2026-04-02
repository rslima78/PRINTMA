import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { calcularFolhas, calcularPrazo } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const coordenador_id = searchParams.get("coordenador_id");
    const professor_id = searchParams.get("professor_id");
    const ativo = searchParams.get("ativo"); // "true" para pedidos ativos

    const where: any = {};
    if (status) where.status = status;
    if (coordenador_id) where.coordenador_id = coordenador_id;
    if (professor_id) where.professor_id = professor_id;
    if (ativo === "true") where.status = { in: ["AGUARDANDO", "EM_IMPRESSAO"] };

    const pedidos = await prisma.pedido.findMany({
      where,
      include: {
        coordenador: { select: { id: true, nome: true, foto_url: true } },
        professor: { select: { id: true, nome: true } },
        turmas: true,
        historico: { orderBy: { criado_em: "desc" }, take: 5 },
      },
      orderBy: [
        { prioridade: "desc" },
        { criado_em: "asc" },
      ],
    });

    return NextResponse.json(pedidos);
  } catch (error) {
    console.error("Erro GET pedidos:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const {
      professor_id,
      disciplina_id,
      disciplina_nome,
      tipo_avaliacao,
      observacao,
      pdf_url,
      pdf_paginas,
      num_copias,
      turmas, // [{ turma_id, turma_nome, num_estudantes }]
      obs_reimpressao,
      prioridade,
    } = body;

    const folhas_necessarias = calcularFolhas(pdf_paginas, num_copias);
    const prazo = calcularPrazo();

    const pedido = await prisma.pedido.create({
      data: {
        coordenador_id: (session.user as any).id,
        professor_id,
        disciplina_id,
        disciplina_nome,
        tipo_avaliacao,
        observacao,
        pdf_url,
        pdf_paginas,
        num_copias,
        folhas_necessarias,
        prazo,
        status: "AGUARDANDO",
        prioridade: prioridade || false,
        obs_reimpressao,
        turmas: {
          create: turmas.map((t: any) => ({
            turma_id: t.turma_id,
            turma_nome: t.turma_nome,
            num_estudantes: t.num_estudantes,
          })),
        },
      },
      include: {
        coordenador: true,
        professor: true,
        turmas: true,
      },
    });

    // Registrar histórico inicial
    await prisma.historicoStatus.create({
      data: {
        pedido_id: pedido.id,
        status_anterior: "AGUARDANDO",
        status_novo: "AGUARDANDO",
        alterado_por: (session.user as any).id,
      },
    });

    return NextResponse.json(pedido, { status: 201 });
  } catch (error) {
    console.error("Erro POST pedido:", error);
    return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 });
  }
}
