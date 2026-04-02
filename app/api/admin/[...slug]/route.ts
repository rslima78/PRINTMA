import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest, props: { params: Promise<{ slug: string[] }> }) {
  try {
    const params = await props.params;
    const slug = params.slug;
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).perfil !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (slug[0] === "coordenadores") {
      const coordenadores = await prisma.usuario.findMany({
        where: { perfil: "COORDENADOR" },
        select: { id: true, nome: true, email: true, foto_url: true, ativo: true, criado_em: true },
        orderBy: { nome: "asc" },
      });
      return NextResponse.json(coordenadores);
    }
    else if (slug[0] === "associacoes") {
      const associacoes = await prisma.associacao.findMany({
        include: {
          professor: true,
          disciplina: true,
          turmas: { include: { turma: true } },
        },
        orderBy: { professor: { nome: "asc" } },
      });
      return NextResponse.json(associacoes);
    }
    else if (slug[0] === "importar" && slug[1]) {
      const entidade = slug[1];
      if (entidade === "disciplinas") return NextResponse.json(await prisma.disciplina.findMany({ orderBy: { nome: "asc" } }));
      if (entidade === "professores") return NextResponse.json(await prisma.professor.findMany({ orderBy: { nome: "asc" } }));
      if (entidade === "turmas") return NextResponse.json(await prisma.turma.findMany({ orderBy: { nome: "asc" } }));
      return NextResponse.json({ error: "Entidade inválida" }, { status: 400 });
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, props: { params: Promise<{ slug: string[] }> }) {
  try {
    const params = await props.params;
    const slug = params.slug;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).perfil !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (slug[0] === "coordenadores") {
      const { nome, email, senha, foto_url } = await req.json();
      const senhaHash = await bcrypt.hash(senha, 10);
      const coordenador = await prisma.usuario.create({
        data: { nome, email, senha: senhaHash, perfil: "COORDENADOR", foto_url },
      });
      return NextResponse.json({ id: coordenador.id, nome: coordenador.nome, email: coordenador.email }, { status: 201 });
    }
    else if (slug[0] === "associacoes") {
      const { professor_id, disciplina_id, turma_ids } = await req.json();
      const associacao = await prisma.associacao.create({
        data: {
          professor_id,
          disciplina_id,
          turmas: {
            create: turma_ids.map((turma_id: string) => ({ turma_id })),
          },
        },
        include: {
          professor: true,
          disciplina: true,
          turmas: { include: { turma: true } },
        },
      });
      return NextResponse.json(associacao, { status: 201 });
    }
    else if (slug[0] === "importar" && slug[1]) {
      const entidade = slug[1];
      const body = await req.json();
      const items: any[] = body.items || [body];

      if (entidade === "disciplinas") {
        const result = await prisma.$transaction(
          items.map((item) =>
            prisma.disciplina.upsert({ where: { nome: item.nome }, update: {}, create: { nome: item.nome } })
          )
        );
        return NextResponse.json({ count: result.length });
      }
      if (entidade === "professores") {
        const result = await prisma.$transaction(items.map((item) => prisma.professor.create({ data: { nome: item.nome } })));
        return NextResponse.json({ count: result.length });
      }
      if (entidade === "turmas") {
        const result = await prisma.$transaction(items.map((item) => prisma.turma.create({ data: { nome: item.nome, num_estudantes: parseInt(item.num_estudantes) } })));
        return NextResponse.json({ count: result.length });
      }
      return NextResponse.json({ error: "Entidade inválida" }, { status: 400 });
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error: any) {
    if (error.code === "P2002") return NextResponse.json({ error: "Registro já existe" }, { status: 409 });
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ slug: string[] }> }) {
  try {
    const params = await props.params;
    const slug = params.slug;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).perfil !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    if (slug[0] === "coordenadores") {
      const { id, ativo } = await req.json();
      const atualizado = await prisma.usuario.update({ where: { id }, data: { ativo } });
      return NextResponse.json(atualizado);
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ slug: string[] }> }) {
  try {
    const params = await props.params;
    const slug = params.slug;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).perfil !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    if (slug[0] === "associacoes" && slug[1]) {
      await prisma.associacao.delete({ where: { id: slug[1] } });
      return NextResponse.json({ success: true });
    }
    else if (slug[0] === "importar" && slug[1]) {
      const entidade = slug[1];
      const { id } = await req.json();
      if (entidade === "disciplinas") await prisma.disciplina.delete({ where: { id } });
      else if (entidade === "professores") await prisma.professor.delete({ where: { id } });
      else if (entidade === "turmas") await prisma.turma.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error: any) {
    if (error.code === "P2003" || error.code === "P2014") return NextResponse.json({ error: "Existem associações" }, { status: 409 });
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}
