"use client";
import { useEffect, useMemo, useState } from "react";
import { CardPedido } from "@/components/CardPedido";
import { ResumoPedido } from "@/components/ResumoPedido";
import {
  BarraFiltrosPedidos,
  FiltrosPedidosState,
  aplicarFiltrosEOrdenacao,
  filtrosIniciaisPadrao,
} from "@/components/BarraFiltrosPedidos";
import { calcularUrgencia } from "@/lib/utils";

export default function OperadorDashboard() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<any | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [coordenadores, setCoordenadores] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [modalReimprimir, setModalReimprimir] = useState<string | null>(null);
  const [obsReimpressao, setObsReimpressao] = useState("");
  const [filtros, setFiltros] = useState<FiltrosPedidosState>({
    ...filtrosIniciaisPadrao,
    escopoStatus: "FILA",
    ordenacao: "urgencia",
  });

  const carregar = async () => {
    const res = await fetch("/api/pedidos");
    if (res.ok) {
      const lista = await res.json();
      setPedidos(lista);
      if (pedidoSelecionado) {
        setPedidoSelecionado(lista.find((p: any) => p.id === pedidoSelecionado.id) || null);
      }
    }
    setLoading(false);
  };

  const carregarCatalogos = async () => {
    try {
      const [resCoord, resProf] = await Promise.all([
        fetch("/api/coordenadores"),
        fetch("/api/admin/importar/professores"),
      ]);
      if (resCoord.ok) setCoordenadores(await resCoord.json());
      if (resProf.ok) {
        const data = await resProf.json();
        if (Array.isArray(data)) setProfessores(data);
      }
    } catch {
      // ignora erro silenciosamente
    }
  };

  useEffect(() => {
    carregar();
    carregarCatalogos();
  }, []);

  const togglePrioridade = async (id: string) => {
    await fetch(`/api/pedidos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "prioridade" }),
    });
    await carregar();
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

  const reimprimir = async () => {
    if (!obsReimpressao.trim() || !modalReimprimir) return;
    await fetch(`/api/pedidos/${modalReimprimir}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reimprimir", obs_reimpressao: obsReimpressao }),
    });
    setModalReimprimir(null);
    setObsReimpressao("");
    await carregar();
  };

  // Pedidos pendentes para o card de Estimativa de Papel
  const pedidosPendentes = useMemo(
    () => pedidos.filter((p) => p.status === "AGUARDANDO" || p.status === "EM_IMPRESSAO"),
    [pedidos]
  );

  const totalFolhasPendentes = useMemo(
    () => pedidosPendentes.reduce((acc, p) => acc + (p.folhas_necessarias || 0), 0),
    [pedidosPendentes]
  );

  const folhasPendentesGrupo = useMemo(
    () => ({
      URGENTE: pedidosPendentes
        .filter((p) => calcularUrgencia(p.prazo) === "URGENTE" || calcularUrgencia(p.prazo) === "VENCIDO")
        .reduce((acc, p) => acc + (p.folhas_necessarias || 0), 0),
      NO_PRAZO: pedidosPendentes
        .filter((p) => calcularUrgencia(p.prazo) === "NO_PRAZO")
        .reduce((acc, p) => acc + (p.folhas_necessarias || 0), 0),
      NOVO: pedidosPendentes
        .filter((p) => calcularUrgencia(p.prazo) === "NOVO")
        .reduce((acc, p) => acc + (p.folhas_necessarias || 0), 0),
    }),
    [pedidosPendentes]
  );

  // Pedidos filtrados e ordenados conforme seleção do operador
  const pedidosFiltrados = useMemo(
    () => aplicarFiltrosEOrdenacao(pedidos, filtros),
    [pedidos, filtros]
  );

  const totalFolhasFiltradas = useMemo(
    () => pedidosFiltrados.reduce((acc, p) => acc + (p.folhas_necessarias || 0), 0),
    [pedidosFiltrados]
  );

  // Agrupamento por urgência e status (para modo de visualização agrupada)
  const grupos = useMemo(
    () => ({
      URGENTE: pedidosFiltrados.filter(
        (p) =>
          p.status !== "CONCLUIDO" &&
          p.status !== "CANCELADO" &&
          (calcularUrgencia(p.prazo) === "URGENTE" || calcularUrgencia(p.prazo) === "VENCIDO")
      ),
      NO_PRAZO: pedidosFiltrados.filter(
        (p) =>
          p.status !== "CONCLUIDO" &&
          p.status !== "CANCELADO" &&
          calcularUrgencia(p.prazo) === "NO_PRAZO"
      ),
      NOVO: pedidosFiltrados.filter(
        (p) =>
          p.status !== "CONCLUIDO" &&
          p.status !== "CANCELADO" &&
          calcularUrgencia(p.prazo) === "NOVO"
      ),
      CONCLUIDO: [...pedidosFiltrados.filter((p) => p.status === "CONCLUIDO")].sort(
        (a, b) =>
          new Date(b.atualizado_em || b.criado_em).getTime() -
          new Date(a.atualizado_em || a.criado_em).getTime()
      ),
    }),
    [pedidosFiltrados]
  );

  const secoes = [
    { key: "URGENTE", label: "🔴 URGENTE — 0 a 2 dias", fundoCor: "bg-red-50", borda: "border-red-200" },
    { key: "NO_PRAZO", label: "🟡 NO PRAZO — 3 a 5 dias", fundoCor: "bg-yellow-50", borda: "border-yellow-200" },
    { key: "NOVO", label: "🟢 NOVOS — 6 a 7 dias", fundoCor: "bg-green-50", borda: "border-green-200" },
    { key: "CONCLUIDO", label: "✅ CONCLUÍDOS", fundoCor: "bg-gray-50", borda: "border-gray-200" },
  ];

  const exibirListaUnicaOrdenada =
    filtros.ordenacao !== "urgencia" || filtros.escopoStatus === "CONCLUIDO";

  const rotuloOrdenacao: Record<string, string> = {
    recente: "Ordenados do mais recente para o mais antigo",
    antigo: "Ordenados do mais antigo para o mais recente",
    prazo: "Ordenados por prazo de entrega mais próximo",
    folhas: "Ordenados por maior quantidade de folhas",
    urgencia: "Ordenados por urgência e prioridade",
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Card Estimativa */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-5 text-white mb-6 shadow-lg">
          <h2 className="text-sm font-semibold text-indigo-200 uppercase tracking-wide mb-1">
            Estimativa de Papel — Pedidos Pendentes na Fila ({pedidosPendentes.length})
          </h2>
          <p className="text-4xl font-black">
            {totalFolhasPendentes.toLocaleString("pt-BR")}{" "}
            <span className="text-xl font-normal text-indigo-200">folhas</span>
          </p>
          <div className="flex gap-4 mt-3 flex-wrap">
            <div className="bg-red-500/30 rounded-xl px-3 py-2">
              <p className="text-xs text-red-200">Urgentes</p>
              <p className="text-lg font-bold">{folhasPendentesGrupo.URGENTE}</p>
            </div>
            <div className="bg-yellow-500/30 rounded-xl px-3 py-2">
              <p className="text-xs text-yellow-200">No Prazo</p>
              <p className="text-lg font-bold">{folhasPendentesGrupo.NO_PRAZO}</p>
            </div>
            <div className="bg-green-500/30 rounded-xl px-3 py-2">
              <p className="text-xs text-green-200">Novos</p>
              <p className="text-lg font-bold">{folhasPendentesGrupo.NOVO}</p>
            </div>
          </div>
        </div>

        {/* Barra de Busca e Filtros Completa */}
        <BarraFiltrosPedidos
          pedidosOriginais={pedidos}
          pedidosFiltradosCount={pedidosFiltrados.length}
          folhasFiltradasTotal={totalFolhasFiltradas}
          filtros={filtros}
          onChange={setFiltros}
          mostrarFiltroCoordenador={true}
          coordenadores={coordenadores}
          professoresCatalogo={professores}
          escopoPadrao="FILA"
          ordenacaoPadrao="urgencia"
        />

        {loading ? (
          <div className="text-center py-16 text-gray-400">Carregando fila...</div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <p className="text-5xl mb-3">{filtros.escopoStatus === "FILA" && pedidosPendentes.length === 0 ? "✅" : "🔍"}</p>
            <p className="text-xl font-bold text-gray-600">
              {filtros.escopoStatus === "FILA" && pedidosPendentes.length === 0
                ? "Fila vazia!"
                : "Nenhum trabalho encontrado com os filtros aplicados"}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {filtros.escopoStatus === "FILA" && pedidosPendentes.length === 0
                ? "Todos os pedidos pendentes foram processados. Você pode pesquisar nos Concluídos usando as abas acima."
                : "Tente ajustar o período, o professor, o coordenador ou o termo pesquisado."}
            </p>
          </div>
        ) : exibirListaUnicaOrdenada ? (
          <div>
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">
              Resultados ({pedidosFiltrados.length}) — {rotuloOrdenacao[filtros.ordenacao]}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {pedidosFiltrados.map((pedido) => (
                <CardPedido
                  key={pedido.id}
                  pedido={pedido}
                  selecionado={pedidoSelecionado?.id === pedido.id}
                  onClick={() => setPedidoSelecionado(pedido)}
                  onPrioridadeToggle={() => togglePrioridade(pedido.id)}
                  onReimprimir={
                    pedido.status === "CONCLUIDO" ? () => setModalReimprimir(pedido.id) : undefined
                  }
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {secoes.map(({ key, label, fundoCor, borda }) => {
              const lista = grupos[key as keyof typeof grupos];
              if (lista.length === 0) return null;
              return (
                <div key={key}>
                  <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
                    {label} <span className="text-gray-400">({lista.length})</span>
                  </h2>
                  <div className={`rounded-xl border p-3 ${fundoCor} ${borda}`}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {lista.map((pedido) => (
                        <CardPedido
                          key={pedido.id}
                          pedido={pedido}
                          selecionado={pedidoSelecionado?.id === pedido.id}
                          onClick={() => setPedidoSelecionado(pedido)}
                          onPrioridadeToggle={() => togglePrioridade(pedido.id)}
                          onReimprimir={
                            pedido.status === "CONCLUIDO"
                              ? () => setModalReimprimir(pedido.id)
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Painel Lateral */}
      {pedidoSelecionado && (
        <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto shrink-0 shadow-xl">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Detalhes do Pedido</h2>
            <button
              onClick={() => setPedidoSelecionado(null)}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>

          <div className="p-5 space-y-4">
            <ResumoPedido pedido={pedidoSelecionado} />

            <div className="border-t border-gray-100 pt-4 space-y-2">
              <a
                href={`/api/pedidos/download?id=${pedidoSelecionado.id}`}
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

              {(pedidoSelecionado.status === "AGUARDANDO" ||
                pedidoSelecionado.status === "EM_IMPRESSAO") && (
                <button
                  onClick={() => atualizarStatus(pedidoSelecionado.id, "CONCLUIDO")}
                  disabled={atualizando}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
                >
                  ✅ Marcar como Concluído
                </button>
              )}

              {pedidoSelecionado.status === "CONCLUIDO" && (
                <button
                  onClick={() => setModalReimprimir(pedidoSelecionado.id)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors text-sm"
                >
                  ↩ Reimprimir Pedido
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Reimpressão */}
      {modalReimprimir && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Reimprimir Pedido</h2>
            <textarea
              rows={3}
              value={obsReimpressao}
              onChange={(e) => setObsReimpressao(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              placeholder="Motivo da reimpressão (obrigatório)..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setModalReimprimir(null);
                  setObsReimpressao("");
                }}
                className="flex-1 py-2 border border-gray-300 rounded-xl text-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={reimprimir}
                disabled={!obsReimpressao.trim()}
                className="flex-1 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
