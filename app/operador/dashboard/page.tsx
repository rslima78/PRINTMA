"use client";
import { useEffect, useState } from "react";
import { CardPedido } from "@/components/CardPedido";
import { ResumoPedido } from "@/components/ResumoPedido";
import { FotoAvatar } from "@/components/FotoAvatar";
import { calcularUrgencia } from "@/lib/utils";

export default function OperadorDashboard() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<any | null>(null);
  const [busca, setBusca] = useState("");
  const [atualizando, setAtualizando] = useState(false);

  const carregar = async () => {
    const res = await fetch("/api/pedidos?ativo=true");
    setPedidos(await res.json());
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const atualizar = (id: string) => carregar().then(() => {
    setPedidos((prev) => prev.map((p) => p.id === id ? { ...p } : p));
  });

  const togglePrioridade = async (id: string) => {
    await fetch(`/api/pedidos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "prioridade" })
    });
    await carregar();
    if (pedidoSelecionado?.id === id) {
      const res = await fetch(`/api/pedidos?ativo=true`);
      const lista = await res.json();
      setPedidoSelecionado(lista.find((p: any) => p.id === id) || null);
    }
  };

  const atualizarStatus = async (id: string, status: string) => {
    setAtualizando(true);
    await fetch(`/api/pedidos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", status }),
    });
    await carregar();
    setPedidoSelecionado(null);
    setAtualizando(false);
  };

  // Agrupamento por urgência
  const grupos = {
    URGENTE: pedidos.filter((p) => calcularUrgencia(p.prazo) === "URGENTE" || calcularUrgencia(p.prazo) === "VENCIDO"),
    NO_PRAZO: pedidos.filter((p) => calcularUrgencia(p.prazo) === "NO_PRAZO"),
    NOVO: pedidos.filter((p) => calcularUrgencia(p.prazo) === "NOVO"),
  };

  // Estimativa de papel
  const totalFolhas = pedidos.reduce((acc, p) => acc + p.folhas_necessarias, 0);
  const folhasGrupo = {
    URGENTE: grupos.URGENTE.reduce((acc, p) => acc + p.folhas_necessarias, 0),
    NO_PRAZO: grupos.NO_PRAZO.reduce((acc, p) => acc + p.folhas_necessarias, 0),
    NOVO: grupos.NOVO.reduce((acc, p) => acc + p.folhas_necessarias, 0),
  };

  // Busca por professor
  const resultadoBusca = busca.trim()
    ? pedidos.filter((p) => p.professor.nome.toLowerCase().includes(busca.toLowerCase()))
    : [];

  const secoes = [
    { key: "URGENTE", label: "🔴 URGENTE — 0 a 2 dias", fundoCor: "bg-red-50", borda: "border-red-200", header: "bg-red-100" },
    { key: "NO_PRAZO", label: "🟡 NO PRAZO — 3 a 5 dias", fundoCor: "bg-yellow-50", borda: "border-yellow-200", header: "bg-yellow-100" },
    { key: "NOVO", label: "🟢 NOVOS — 6 a 7 dias", fundoCor: "bg-green-50", borda: "border-green-200", header: "bg-green-100" },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Card Estimativa */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-5 text-white mb-6 shadow-lg">
          <h2 className="text-sm font-semibold text-indigo-200 uppercase tracking-wide mb-1">Estimativa de Papel — Pedidos Pendentes</h2>
          <p className="text-4xl font-black">{totalFolhas.toLocaleString("pt-BR")} <span className="text-xl font-normal text-indigo-200">folhas</span></p>
          <div className="flex gap-4 mt-3 flex-wrap">
            <div className="bg-red-500/30 rounded-xl px-3 py-2">
              <p className="text-xs text-red-200">Urgentes</p>
              <p className="text-lg font-bold">{folhasGrupo.URGENTE}</p>
            </div>
            <div className="bg-yellow-500/30 rounded-xl px-3 py-2">
              <p className="text-xs text-yellow-200">No Prazo</p>
              <p className="text-lg font-bold">{folhasGrupo.NO_PRAZO}</p>
            </div>
            <div className="bg-green-500/30 rounded-xl px-3 py-2">
              <p className="text-xs text-green-200">Novos</p>
              <p className="text-lg font-bold">{folhasGrupo.NOVO}</p>
            </div>
          </div>
        </div>

        {/* Busca por professor */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="🔍 Buscar por nome do professor..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          />
          {resultadoBusca.length > 0 && (
            <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-sm divide-y divide-gray-100 overflow-hidden">
              {resultadoBusca.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 cursor-pointer transition-colors" onClick={() => setPedidoSelecionado(p)}>
                  <FotoAvatar nome={p.coordenador.nome} foto_url={p.coordenador.foto_url} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{p.professor.nome}</p>
                    <p className="text-xs text-gray-500">{p.disciplina_nome} • {p.tipo_avaliacao}</p>
                  </div>
                  <a href={p.pdf_url} target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="ml-auto text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200">
                    ⬇ PDF
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Carregando fila...</div>
        ) : (
          <div className="space-y-6">
            {secoes.map(({ key, label, fundoCor, borda }) => {
              const lista = grupos[key as keyof typeof grupos];
              if (lista.length === 0) return null;
              return (
                <div key={key}>
                  <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">{label} <span className="text-gray-400">({lista.length})</span></h2>
                  <div className={`rounded-xl border p-3 ${fundoCor} ${borda}`}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {lista.map((pedido) => (
                        <CardPedido
                          key={pedido.id}
                          pedido={pedido}
                          onClick={() => setPedidoSelecionado(pedido)}
                          onPrioridadeToggle={() => togglePrioridade(pedido.id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            {pedidos.length === 0 && (
              <div className="text-center py-20">
                <p className="text-5xl mb-3">✅</p>
                <p className="text-xl font-bold text-gray-600">Fila vazia!</p>
                <p className="text-gray-400 text-sm mt-1">Todos os pedidos foram processados</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Painel Lateral */}
      {pedidoSelecionado && (
        <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto shrink-0 shadow-xl">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Detalhes do Pedido</h2>
            <button onClick={() => setPedidoSelecionado(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
          </div>

          <div className="p-5 space-y-4">
            <ResumoPedido pedido={pedidoSelecionado} />

            <div className="border-t border-gray-100 pt-4 space-y-2">
              <a
                href={pedidoSelecionado.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors text-sm"
              >
                ⬇ Baixar PDF
              </a>

              {pedidoSelecionado.status === "AGUARDANDO" && (
                <button
                  onClick={() => atualizarStatus(pedidoSelecionado.id, "EM_IMPRESSAO")}
                  disabled={atualizando}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors text-sm"
                >
                  ▶ Iniciar Impressão
                </button>
              )}

              {(pedidoSelecionado.status === "AGUARDANDO" || pedidoSelecionado.status === "EM_IMPRESSAO") && (
                <button
                  onClick={() => atualizarStatus(pedidoSelecionado.id, "CONCLUIDO")}
                  disabled={atualizando}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
                >
                  ✅ Marcar como Concluído
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
