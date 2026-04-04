"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Pedido {
  id: string;
  professor: { nome: string };
  disciplina_nome: string;
  turmas: { turma_nome: string }[];
  criado_em: string;
  status: string;
  coordenador: { nome: string };
}

export default function AdminPedidosPage() {
  const { data: session } = useSession();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPedidos();
  }, []);

  async function fetchPedidos() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pedidos");
      if (res.ok) {
        const data = await res.json();
        setPedidos(data);
      }
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
    } finally {
      setLoading(false);
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === pedidos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pedidos.map((p) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmMessage = selectedIds.length === 1 
      ? "Tem certeza que deseja apagar este pedido de impressão?" 
      : `Tem certeza que deseja apagar estes ${selectedIds.length} pedidos de impressão?`;

    if (!confirm(confirmMessage)) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/admin/pedidos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (res.ok) {
        alert("Pedidos excluídos com sucesso!");
        setSelectedIds([]);
        fetchPedidos();
      } else {
        alert("Erro ao excluir pedidos.");
      }
    } catch (error) {
      console.error("Erro ao excluir pedidos:", error);
      alert("Erro ao excluir pedidos.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading && pedidos.length === 0) {
    return <div className="p-8 text-center text-gray-500">Carregando pedidos...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Pedidos</h1>
          <p className="text-gray-500 mt-1">Exclua pedidos de impressão do sistema de forma definitiva.</p>
        </div>
        
        {selectedIds.length > 0 && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            <span>{deleting ? "Apagando..." : "🗑️ Apagar Selecionados"}</span>
            <span className="bg-red-500 px-2 py-0.5 rounded text-xs">{selectedIds.length}</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 w-12">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    checked={pedidos.length > 0 && selectedIds.length === pedidos.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-4 text-sm font-semibold text-gray-600 uppercase">Data</th>
                <th className="p-4 text-sm font-semibold text-gray-600 uppercase">Professor / Disciplina</th>
                <th className="p-4 text-sm font-semibold text-gray-600 uppercase">Turmas</th>
                <th className="p-4 text-sm font-semibold text-gray-600 uppercase">Status</th>
                <th className="p-4 text-sm font-semibold text-gray-600 uppercase">Coordenador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pedidos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 italic">
                    Nenhum pedido encontrado no sistema.
                  </td>
                </tr>
              ) : (
                pedidos.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        checked={selectedIds.includes(pedido.id)}
                        onChange={() => toggleSelect(pedido.id)}
                      />
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      {format(new Date(pedido.criado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-gray-900">{pedido.professor.nome}</p>
                      <p className="text-xs text-gray-500">{pedido.disciplina_nome}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {pedido.turmas.map((t, idx) => (
                          <span key={idx} className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded border border-gray-200">
                            {t.turma_nome}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        pedido.status === "AGUARDANDO" ? "bg-yellow-100 text-yellow-700" :
                        pedido.status === "EM_IMPRESSAO" ? "bg-blue-100 text-blue-700" :
                        pedido.status === "CONCLUIDO" ? "bg-green-100 text-green-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {pedido.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {pedido.coordenador.nome}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
