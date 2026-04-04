import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const coordenadores = await prisma.usuario.findMany({
      where: { perfil: "COORDENADOR", deletado: false, ativo: true },
      select: { id: true, nome: true, foto_url: true },
      orderBy: { nome: "asc" },
    });
    return NextResponse.json(coordenadores);
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
