"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { calcularFolhas } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

type Passo = 1 | 2 | 3;

interface Professor { id: string; nome: string; }
interface Disciplina { id: string; nome: string; }
interface Turma { id: string; nome: string; num_estudantes: number; }
interface Associacao {
  id: string;
  professor_id: string;
  disciplina: Disciplina;
  disciplina_id: string;
  turmas: { turma: Turma; turma_id: string }[];
}

const tipoOpcoes = ["TESTE", "PROVA", "OUTROS"];
const tipoLabels: Record<string, string> = { TESTE: "Teste", PROVA: "Prova", OUTROS: "Outros" };

export default function NovoPedidoPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [passo, setPasso] = useState<Passo>(1);

  // Dados
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [associacoes, setAssociacoes] = useState<Associacao[]>([]);

  // Formulário passo 1
  const [professorId, setProfessorId] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [tipoAvaliacao, setTipoAvaliacao] = useState("");
  const [turmasSelecionadas, setTurmasSelecionadas] = useState<Turma[]>([]);
  const [numCopias, setNumCopias] = useState(0);
  const [observacao, setObservacao] = useState("");

  // Passo 2 — PDF
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfPaginas, setPdfPaginas] = useState(0);
  const [pdfNome, setPdfNome] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadando, setUploadando] = useState(false);
  const [erroUpload, setErroUpload] = useState("");

  // Passo 3
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    fetch("/api/admin/importar/professores").then((r) => r.json()).then(setProfessores);
    fetch("/api/admin/associacoes").then((r) => r.json()).then(setAssociacoes);
  }, []);

  // Derivados
  const disciplinasFiltradas = associacoes
    .filter((a) => a.professor_id === professorId)
    .map((a) => ({ id: a.disciplina_id, nome: a.disciplina.nome }))
    .filter((d, i, arr) => arr.findIndex((x) => x.id === d.id) === i);

  const turmasFiltradas = associacoes
    .filter((a) => a.professor_id === professorId && a.disciplina_id === disciplinaId)
    .flatMap((a) => a.turmas.map((t) => t.turma));

  const toggleTurma = (turma: Turma) => {
    setTurmasSelecionadas((prev) => {
      const exists = prev.find((t) => t.id === turma.id);
      const nova = exists ? prev.filter((t) => t.id !== turma.id) : [...prev, turma];
      setNumCopias(nova.reduce((acc, t) => acc + t.num_estudantes, 0));
      return nova;
    });
  };

  // Upload PDF
  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setErroUpload("");
    setUploadando(true);
    setUploadProgress(10);

    try {
      const fd = new FormData();
      fd.append("file", file);
      setUploadProgress(30);
      const res = await fetch("/api/upload/pdf", { method: "POST", body: fd });
      setUploadProgress(80);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPdfUrl(data.pdf_url);
      setPdfPaginas(data.pdf_paginas);
      setPdfNome(file.name);
      setUploadProgress(100);
    } catch (e: any) {
      setErroUpload(e.message || "Erro ao enviar PDF");
    } finally {
      setUploadando(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 30 * 1024 * 1024,
  });

  const professorSelecionado = professores.find((p) => p.id === professorId);
  const disciplinaSelecionada = disciplinasFiltradas.find((d) => d.id === disciplinaId);
  const folhasNecessarias = calcularFolhas(pdfPaginas, numCopias);
  const prazo = addDays(new Date(), 7);

  const handleConfirmar = async () => {
    setEnviando(true);
    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professor_id: professorId,
          disciplina_id: disciplinaId,
          disciplina_nome: disciplinaSelecionada?.nome,
          tipo_avaliacao: tipoAvaliacao,
          observacao,
          pdf_url: pdfUrl,
          pdf_paginas: pdfPaginas,
          num_copias: numCopias,
          turmas: turmasSelecionadas.map((t) => ({
            turma_id: t.id,
            turma_nome: t.nome,
            num_estudantes: t.num_estudantes,
          })),
        }),
      });
      if (!res.ok) throw new Error("Erro ao criar pedido");
      router.push("/coordenador/dashboard");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setEnviando(false);
    }
  };

  const podePasso2 = professorId && disciplinaId && tipoAvaliacao && turmasSelecionadas.length > 0 && numCopias > 0;
  const podePasso3 = pdfUrl && pdfPaginas > 0;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Novo Pedido de Impressão</h1>

      {/* Passos */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              passo === n ? "bg-indigo-600 text-white" :
              passo > n ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
            }`}>
              {passo > n ? "✓" : n}
            </div>
            <span className={`text-sm ${passo === n ? "text-indigo-700 font-semibold" : "text-gray-400"}`}>
              {n === 1 ? "Seleção" : n === 2 ? "Upload PDF" : "Confirmação"}
            </span>
            {n < 3 && <div className="w-8 h-px bg-gray-300 mx-1" />}
          </div>
        ))}
      </div>

      {/* Passo 1 */}
      {passo === 1 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Professor *</label>
            <select
              value={professorId}
              onChange={(e) => { setProfessorId(e.target.value); setDisciplinaId(""); setTurmasSelecionadas([]); setNumCopias(0); }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            >
              <option value="">Selecione o professor...</option>
              {professores.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Disciplina *</label>
            <select
              value={disciplinaId}
              onChange={(e) => { setDisciplinaId(e.target.value); setTurmasSelecionadas([]); setNumCopias(0); }}
              disabled={!professorId}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">Selecione a disciplina...</option>
              {disciplinasFiltradas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Turma(s) *</label>
            <div className={`rounded-lg border overflow-hidden ${!disciplinaId ? "opacity-50 pointer-events-none" : ""}`}>
              {turmasFiltradas.length === 0 ? (
                <div className="p-4 text-sm text-gray-400 text-center">
                  {disciplinaId ? "Nenhuma turma associada" : "Selecione professor e disciplina primeiro"}
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto divide-y divide-gray-100">
                  {turmasFiltradas.map((t) => {
                    const selecionada = turmasSelecionadas.find((x) => x.id === t.id);
                    return (
                      <label key={t.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-indigo-50 transition-colors ${selecionada ? "bg-indigo-50" : ""}`}>
                        <input type="checkbox" checked={!!selecionada} onChange={() => toggleTurma(t)}
                          className="rounded border-gray-300 text-indigo-600" />
                        <span className="text-sm font-medium text-gray-700">{t.nome}</span>
                        <span className="ml-auto text-xs text-gray-400">{t.num_estudantes} alunos</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipo de Avaliação *</label>
            <div className="flex gap-2">
              {tipoOpcoes.map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setTipoAvaliacao(tipo)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                    tipoAvaliacao === tipo
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"
                  }`}
                >
                  {tipoLabels[tipo]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Número de Cópias *
              {turmasSelecionadas.length > 0 && (
                <span className="text-xs font-normal text-gray-400 ml-2">(pré-calculado pela soma das turmas)</span>
              )}
            </label>
            <input
              type="number"
              min={1}
              value={numCopias || ""}
              onChange={(e) => setNumCopias(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Observação (opcional)</label>
            <textarea
              rows={3}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm resize-none"
              placeholder="Alguma observação adicional..."
            />
          </div>

          <button
            disabled={!podePasso2}
            onClick={() => setPasso(2)}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Próximo: Upload do PDF →
          </button>
        </div>
      )}

      {/* Passo 2 */}
      {passo === 2 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-800">Upload do PDF</h2>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              isDragActive ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400 bg-gray-50"
            }`}
          >
            <input {...getInputProps()} />
            <p className="text-4xl mb-3">{isDragActive ? "📂" : "📄"}</p>
            {pdfUrl ? (
              <div>
                <p className="text-green-600 font-bold">✓ PDF enviado com sucesso!</p>
                <p className="text-sm text-gray-500 mt-1">{pdfNome}</p>
                <p className="text-sm text-indigo-600 font-semibold mt-1">{pdfPaginas} páginas detectadas</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 font-medium">Arraste o PDF aqui ou clique para selecionar</p>
                <p className="text-xs text-gray-400 mt-1">Apenas PDF • Máximo 30 MB</p>
              </div>
            )}
          </div>

          {uploadando && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Enviando...</span><span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {erroUpload && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{erroUpload}</p>}

          <div className="flex gap-3">
            <button onClick={() => setPasso(1)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
              ← Voltar
            </button>
            <button
              disabled={!podePasso3}
              onClick={() => setPasso(3)}
              className="flex-1 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              Ver Resumo →
            </button>
          </div>
        </div>
      )}

      {/* Passo 3 */}
      {passo === 3 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Resumo do Pedido</h2>

          <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-4 space-y-2.5">
            {[
              ["Tipo de Avaliação", tipoLabels[tipoAvaliacao]],
              ["Disciplina", disciplinaSelecionada?.nome],
              ["Professor", professorSelecionado?.nome],
              ["Turma(s)", turmasSelecionadas.map((t) => t.nome).join(", ")],
              ["Nº de Cópias", numCopias],
              ["Folhas Necessárias", folhasNecessarias],
              ["Prazo de Entrega", format(prazo, "dd/MM/yyyy", { locale: ptBR })],
              ["Observação", observacao || "—"],
              ["Arquivo PDF", pdfNome],
              ["Páginas detectadas", pdfPaginas],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-baseline">
                <span className="text-xs font-medium text-gray-500 w-40 shrink-0">{label}</span>
                <span className="text-sm font-semibold text-gray-800 text-right">{String(value ?? "—")}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setPasso(1)} className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">
              ← Editar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={enviando}
              className="flex-1 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {enviando ? "Enviando..." : "✓ Confirmar e Enviar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
