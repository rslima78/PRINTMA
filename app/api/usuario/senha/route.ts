import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const perfil = (session.user as any).perfil;

    // Apenas ADMIN e OPERADOR podem alterar a própria senha por aqui
    if (perfil !== "ADMIN" && perfil !== "OPERADOR") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { senhaAtual, novaSenha } = await req.json();

    if (!senhaAtual || !novaSenha) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    if (novaSenha.length < 6) {
      return NextResponse.json({ error: "A nova senha deve ter no mínimo 6 caracteres" }, { status: 400 });
    }

    const userId = (session.user as any).id;

    const usuario = await prisma.usuario.findUnique({ where: { id: userId } });

    if (!usuario) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);

    if (!senhaValida) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
    }

    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

    await prisma.usuario.update({
      where: { id: userId },
      data: { senha: novaSenhaHash },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
