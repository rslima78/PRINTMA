import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const inicio = searchParams.get("inicio");
    const fim = searchParams.get("fim");

    const agora = new Date();
    const inicioSemana = new Date(agora);
    inicioSemana.setDate(agora.getDate() - agora.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const inicioAno = new Date(agora.getFullYear(), 0, 1);

    const [semana, mes, ano, periodo] = await Promise.all([
      prisma.pedido.aggregate({
        _sum: { folhas_necessarias: true },
        where: { status: "CONCLUIDO", atualizado_em: { gte: inicioSemana } },
      }),
      prisma.pedido.aggregate({
        _sum: { folhas_necessarias: true },
        where: { status: "CONCLUIDO", atualizado_em: { gte: inicioMes } },
      }),
      prisma.pedido.aggregate({
        _sum: { folhas_necessarias: true },
        where: { status: "CONCLUIDO", atualizado_em: { gte: inicioAno } },
      }),
      inicio && fim
        ? prisma.pedido.aggregate({
            _sum: { folhas_necessarias: true },
            where: {
              status: "CONCLUIDO",
              atualizado_em: { gte: new Date(inicio), lte: new Date(fim) },
            },
          })
        : null,
    ]);

    return NextResponse.json({
      semana: semana._sum.folhas_necessarias || 0,
      mes: mes._sum.folhas_necessarias || 0,
      ano: ano._sum.folhas_necessarias || 0,
      periodo: periodo ? periodo._sum.folhas_necessarias || 0 : null,
    });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar estatísticas" }, { status: 500 });
  }
}
