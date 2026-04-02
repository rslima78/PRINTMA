import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).perfil !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const coordenadores = await prisma.usuario.findMany({
      where: { perfil: "COORDENADOR" },
      select: { id: true, nome: true, email: true, foto_url: true, ativo: true, criado_em: true },
      orderBy: { nome: "asc" },
    });
    return NextResponse.json(coordenadores);
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).perfil !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const { nome, email, senha, foto_url } = await req.json();
    const senhaHash = await bcrypt.hash(senha, 10);
    const coordenador = await prisma.usuario.create({
      data: { nome, email, senha: senhaHash, perfil: "COORDENADOR", foto_url },
    });
    return NextResponse.json({ id: coordenador.id, nome: coordenador.nome, email: coordenador.email }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao criar coordenador" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).perfil !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const { id, ativo } = await req.json();
    const atualizado = await prisma.usuario.update({ where: { id }, data: { ativo } });
    return NextResponse.json(atualizado);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}
