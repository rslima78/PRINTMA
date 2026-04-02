import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
const pdfParse = require("pdf-parse");

export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: NextRequest, props: { params: Promise<{ slug: string[] }> }) {
  try {
    const params = await props.params;
    const slug = params.slug;

    if (slug[0] === "pdf") {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
      if (file.type !== "application/pdf") return NextResponse.json({ error: "Apenas arquivos PDF são aceitos" }, { status: 400 });
      if (file.size > 30 * 1024 * 1024) return NextResponse.json({ error: "Arquivo muito grande (máximo 30MB)" }, { status: 400 });

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const pdfData = await pdfParse(buffer);
      const numPaginas = pdfData.numpages;

      const resultado = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: "raw", folder: "impressoes", public_id: `pedido_${Date.now()}`, format: "pdf" },
          (error, result) => { if (error) reject(error); else resolve(result); }
        ).end(buffer);
      });

      return NextResponse.json({ pdf_url: resultado.secure_url, pdf_paginas: numPaginas, nome_arquivo: file.name });
    } 
    else if (slug[0] === "imagem") {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const resultado = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: "image", folder: "coordenadores", public_id: `coord_${Date.now()}`, transformation: [{ width: 200, height: 200, crop: "fill", gravity: "face" }] },
          (error, result) => { if (error) reject(error); else resolve(result); }
        ).end(buffer);
      });

      return NextResponse.json({ url: resultado.secure_url });
    }

    return NextResponse.json({ error: "URL inválida" }, { status: 404 });
  } catch (error: any) {
    console.error("ERRO NO UPLOAD/PROCESSAMENTO:", error);
    return NextResponse.json({ error: "Erro ao processar arquivo", detalhe: error.message || error.toString() }, { status: 500 });
  }
}
