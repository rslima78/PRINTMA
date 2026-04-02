import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const pedido = await prisma.pedido.findUnique({ where: { id: params.id } });
    if (!pedido) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const atualizado = await prisma.pedido.update({
      where: { id: params.id },
      data: { prioridade: !pedido.prioridade },
    });

    return NextResponse.json(atualizado);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar prioridade" }, { status: 500 });
  }
}
