import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { calcularFolhas, calcularPrazo } from "@/lib/utils";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

function assinarUrl(url: string) {
  if (!url || !url.includes("res.cloudinary.com")) return url;
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const uploadIdx = pathParts.indexOf("upload");
    if (uploadIdx === -1) return url;

    const resourceType = pathParts[uploadIdx - 1];
    // O Public ID começa após a versão (v1234567)
    const publicIdWithExt = pathParts.slice(uploadIdx + 2).join("/");
    
    // Para 'image', o Cloudinary prefere o publicId sem a extensão final se for para aplicar transformação
    const publicId = resourceType === "image" ? publicIdWithExt.replace(/\.[^/.]+$/, "") : publicIdWithExt;

    return cloudinary.url(publicId, {
      resource_type: resourceType,
      sign_url: true,
      flags: resourceType === "image" ? "attachment" : undefined,
      secure: true,
      format: resourceType === "image" ? "pdf" : undefined
    });
  } catch (e) {
    return url;
  }
}

export async function GET(req: NextRequest, props: { params: Promise<{ slug?: string[] }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const coordenador_id = searchParams.get("coordenador_id");
    const professor_id = searchParams.get("professor_id");
    const ativo = searchParams.get("ativo");

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
      orderBy: [{ prioridade: "desc" }, { criado_em: "asc" }],
    });

    const pedidosComUrlAssinada = pedidos.map(p => ({
      ...p,
      pdf_url: assinarUrl(p.pdf_url)
    }));

    return NextResponse.json(pedidosComUrlAssinada);
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, props: { params: Promise<{ slug?: string[] }> }) {
  try {
    const params = await props.params;
    const slug = params.slug || [];
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();

    if (slug.length === 0) {
      // Criar novo pedido
      const { professor_id, disciplina_id, disciplina_nome, tipo_avaliacao, observacao, pdf_url, pdf_paginas, num_copias, turmas, obs_reimpressao, prioridade } = body;
      const folhas_necessarias = calcularFolhas(pdf_paginas, num_copias);
      const prazo = calcularPrazo();

      const pedido = await prisma.pedido.create({
        data: {
          coordenador_id: (session.user as any).id,
          professor_id, disciplina_id, disciplina_nome, tipo_avaliacao, observacao, pdf_url, pdf_paginas,
          num_copias, folhas_necessarias, prazo, status: "AGUARDANDO", prioridade: prioridade || false, obs_reimpressao,
          turmas: {
            create: turmas.map((t: any) => ({ turma_id: t.turma_id, turma_nome: t.turma_nome, num_estudantes: t.num_estudantes })),
          },
        },
      });

      await prisma.historicoStatus.create({
        data: { pedido_id: pedido.id, status_anterior: "AGUARDANDO", status_novo: "AGUARDANDO", alterado_por: (session.user as any).id },
      });
      return NextResponse.json(pedido, { status: 201 });
    }
    else if (slug.length === 1 && body.action === "reimprimir") {
      // Reimprimir
      const id = slug[0];
      const { obs_reimpressao } = body;
      const original = await prisma.pedido.findUnique({ where: { id }, include: { turmas: true } });
      if (!original) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

      const novo = await prisma.pedido.create({
        data: {
          coordenador_id: original.coordenador_id, professor_id: original.professor_id, disciplina_id: original.disciplina_id,
          disciplina_nome: original.disciplina_nome, tipo_avaliacao: original.tipo_avaliacao, observacao: original.observacao,
          pdf_url: original.pdf_url, pdf_paginas: original.pdf_paginas, num_copias: original.num_copias, folhas_necessarias: original.folhas_necessarias,
          prazo: calcularPrazo(), status: "AGUARDANDO", prioridade: true, obs_reimpressao,
          turmas: {
            create: original.turmas.map((t: any) => ({ turma_id: t.turma_id, turma_nome: t.turma_nome, num_estudantes: t.num_estudantes })),
          },
        },
      });
      return NextResponse.json(novo, { status: 201 });
    }
    
    return NextResponse.json({ error: "Ação POST inválida" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ slug?: string[] }> }) {
  try {
    const params = await props.params;
    const slug = params.slug || [];
    if (slug.length !== 1) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    const id = slug[0];
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const pedido = await prisma.pedido.findUnique({ where: { id } });
    if (!pedido) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

    if (body.action === "prioridade") {
      const atualizado = await prisma.pedido.update({ where: { id }, data: { prioridade: !pedido.prioridade } });
      return NextResponse.json(atualizado);
    } else if (body.action === "status" && body.status) {
      const atualizado = await prisma.pedido.update({ where: { id }, data: { status: body.status } });
      await prisma.historicoStatus.create({
        data: { pedido_id: id, status_anterior: pedido.status, status_novo: body.status, alterado_por: (session.user as any).id },
      });
      return NextResponse.json(atualizado);
    }
    return NextResponse.json({ error: "Ação PATCH inválida" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}
