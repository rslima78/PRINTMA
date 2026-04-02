"use client";
import { useEffect, useState } from "react";
import { ImportarCSV } from "@/components/ImportarCSV";

interface Turma { id: string; nome: string; num_estudantes: number; }

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"csv" | "editar" | null>(null);
  const [editando, setEditando] = useState<Turma | null>(null);
  const [msg, setMsg] = useState("");

  const carregar = async () => {
    const res = await fetch("/api/admin/importar/turmas");
    setTurmas(await res.json());
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const importar = async (rows: Record<string, string>[]) => {
    const res = await fetch("/api/admin/importar/turmas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: rows }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setMsg(`${data.count} turmas importadas!`);
    setModal(null);
    carregar();
  };

  const excluir = async (id: string) => {
    if (!confirm("Confirmar exclusão?")) return;
    const res = await fetch("/api/admin/importar/turmas", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) alert(data.error);
    else carregar();
  };

  const salvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando) return;
    // PATCH simples via importar — na prática seria um endpoint de update
    // Por ora, vamos apenas fechar o modal
    setModal(null);
    setEditando(null);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Turmas</h1>
          <p className="text-gray-500 text-sm mt-0.5">{turmas.length} cadastrada(s)</p>
        </div>
        <button
          onClick={() => setModal("csv")}
          className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
        >
          📁 Importar CSV
        </button>
      </div>

      {msg && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">{msg}</div>}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {turmas.length === 0 ? (
            <div className="text-center py-16 text-gray-400">Nenhuma turma cadastrada. Importe um CSV com colunas: nome, num_estudantes</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nº Estudantes</th>
                  <th className="w-32 px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {turmas.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-800">{t.nome}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{t.num_estudantes} alunos</td>
                    <td className="px-6 py-3 text-right">
                      <button onClick={() => excluir(t.id)} className="text-xs text-red-500 hover:text-red-700">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {modal === "csv" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-bold">Importar Turmas CSV</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 text-xl">×</button>
            </div>
            <p className="text-sm text-gray-500 mb-3">O CSV deve conter as colunas: <code className="bg-gray-100 px-1 rounded">nome</code> e <code className="bg-gray-100 px-1 rounded">num_estudantes</code></p>
            <ImportarCSV colunas={["nome", "num_estudantes"]} onImportar={importar} />
          </div>
        </div>
      )}
    </div>
  );
}
