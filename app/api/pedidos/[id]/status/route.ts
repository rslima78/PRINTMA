import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { status } = await req.json();
    const pedido = await prisma.pedido.findUnique({ where: { id: params.id } });
    if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

    const atualizado = await prisma.pedido.update({
      where: { id: params.id },
      data: { status },
    });

    await prisma.historicoStatus.create({
      data: {
        pedido_id: params.id,
        status_anterior: pedido.status,
        status_novo: status,
        alterado_por: (session.user as any).id,
      },
    });

    return NextResponse.json(atualizado);
  } catch (error) {
    console.error("Erro PATCH status:", error);
    return NextResponse.json({ error: "Erro ao atualizar status" }, { status: 500 });
  }
}
