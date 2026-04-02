"use client";
import { useEffect, useState } from "react";
import { ImportarCSV } from "@/components/ImportarCSV";

interface Item { id: string; nome: string; }

function AdminListaPage({
  titulo,
  entidade,
  colunas,
}: {
  titulo: string;
  entidade: string;
  colunas: string[];
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"csv" | "manual" | null>(null);
  const [novoNome, setNovoNome] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [msg, setMsg] = useState("");

  const carregar = async () => {
    const res = await fetch(`/api/admin/importar/${entidade}`);
    const data = await res.json();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const importar = async (rows: Record<string, string>[]) => {
    const res = await fetch(`/api/admin/importar/${entidade}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: rows }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setMsg(`${data.count} itens importados!`);
    setModal(null);
    carregar();
  };

  const adicionarManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const res = await fetch(`/api/admin/importar/${entidade}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: novoNome }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNovoNome("");
      setModal(null);
      setMsg("Item adicionado com sucesso!");
      carregar();
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (id: string) => {
    if (!confirm("Confirmar exclusão?")) return;
    const res = await fetch(`/api/admin/importar/${entidade}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
    } else {
      carregar();
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{titulo}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{items.length} cadastrado(s)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setModal("csv")}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
          >
            📁 Importar CSV
          </button>
          <button
            onClick={() => setModal("manual")}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            + Adicionar
          </button>
        </div>
      </div>

      {msg && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">{msg}</div>}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {items.length === 0 ? (
            <div className="text-center py-16 text-gray-400">Nenhum item cadastrado</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome</th>
                  <th className="w-24 px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-sm text-gray-800 font-medium">{item.nome}</td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => excluir(item.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal CSV */}
      {modal === "csv" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Importar CSV — {titulo}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <ImportarCSV colunas={colunas} onImportar={importar} />
          </div>
        </div>
      )}

      {/* Modal Manual */}
      {modal === "manual" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Adicionar {titulo.slice(0, -1)}</h2>
            <form onSubmit={adicionarManual} className="space-y-4">
              <input
                required
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Nome"
              />
              {erro && <p className="text-sm text-red-600">{erro}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={salvando} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                  {salvando ? "..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DisciplinasPage() {
  return <AdminListaPage titulo="Disciplinas" entidade="disciplinas" colunas={["nome"]} />;
}
