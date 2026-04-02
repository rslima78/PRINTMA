import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Rota de seed inicial — só funciona se não houver usuário admin
// Protegida por token secreto para evitar uso indevido
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (token !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se já existe admin
    const adminExiste = await prisma.usuario.findUnique({
      where: { email: "admin@escola.com" },
    });

    const operadorExiste = await prisma.usuario.findUnique({
      where: { email: "operador@escola.com" },
    });

    const criados = [];

    if (!adminExiste) {
      const senhaHash = await bcrypt.hash("admin123", 10);
      await prisma.usuario.create({
        data: {
          nome: "Administrador",
          email: "admin@escola.com",
          senha: senhaHash,
          perfil: "ADMIN",
          ativo: true,
        },
      });
      criados.push("admin@escola.com / admin123");
    }

    if (!operadorExiste) {
      const senhaHash = await bcrypt.hash("operador123", 10);
      await prisma.usuario.create({
        data: {
          nome: "Operador Padrão",
          email: "operador@escola.com",
          senha: senhaHash,
          perfil: "OPERADOR",
          ativo: true,
        },
      });
      criados.push("operador@escola.com / operador123");
    }

    return NextResponse.json({
      ok: true,
      mensagem: criados.length > 0
        ? `Usuários criados: ${criados.join(" | ")}`
        : "Usuários já existiam",
      criados,
    });
  } catch (error: any) {
    console.error("Erro seed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
