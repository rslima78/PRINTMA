import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const pedidoId = searchParams.get("id");

    if (!pedidoId) return NextResponse.json({ error: "ID do pedido obrigatório" }, { status: 400 });

    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { professor: true }
    });

    if (!pedido || !pedido.pdf_url) return NextResponse.json({ error: "PDF não encontrado" }, { status: 404 });

    // Extrair partes para o Cloudinary
    // Ex: https://res.cloudinary.com/dthenzkea/image/upload/v123/folder/public_id.pdf
    const urlParts = pedido.pdf_url.split("/");
    const uploadIdx = urlParts.indexOf("upload");
    if (uploadIdx === -1) {
       // Se for URL externa, apenas redirecionar
       return NextResponse.redirect(pedido.pdf_url);
    }

    const type = urlParts[uploadIdx - 1]; // image, raw, etc
    const publicIdWithExt = urlParts.slice(uploadIdx + 2).join("/");
    // Para image, remove extensão se houver para o publicId puro
    const publicId = type === "image" ? publicIdWithExt.replace(/\.[^/.]+$/, "") : publicIdWithExt;

    // Gerar uma URL de arquivo ZIP temporário via Admin API (que já testamos que funciona com 200)
    // Embora seja um ZIP, o Cloudinary permite gerar e baixar via API de Administração
    const authenticatedDownloadUrl = cloudinary.utils.download_archive_url({
      public_ids: [publicId],
      resource_type: type,
      target_format: "zip",
      flatten_folders: true
    });

    // Fazer o fetch do arquivo ZIP no servidor
    const response = await fetch(authenticatedDownloadUrl);

    if (!response.ok) {
        console.error("ERRO AO BUSCAR DO CLOUDINARY (API):", response.status, response.statusText);
        return NextResponse.json({ error: "Erro de permissão no Cloudinary" }, { status: response.status });
    }

    // Como é um ZIP de um único arquivo, poderíamos descompactar ou apenas enviar o ZIP
    // Para simplicidade e garantia de funcionamento (já que o ZIP funciona 200), enviaremos o ZIP com nome amigável
    const data = await response.arrayBuffer();
    const headers = new Headers();
    const safeFileName = `${pedido.disciplina_nome}_${pedido.professor.nome}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    headers.set("Content-Type", "application/zip");
    headers.set("Content-Disposition", `attachment; filename="${safeFileName}.zip"`);

    return new NextResponse(data, {
      status: 200,
      headers
    });
  } catch (error: any) {
    console.error("ERRO NO DOWNLOAD PROXY:", error);
    return NextResponse.json({ error: "Erro ao processar download", details: error.message }, { status: 500 });
  }
}
