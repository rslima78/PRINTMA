"use client";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { CardPedido } from "@/components/CardPedido";
import { ResumoPedido } from "@/components/ResumoPedido";
import {
  BarraFiltrosPedidos,
  FiltrosPedidosState,
  aplicarFiltrosEOrdenacao,
  filtrosIniciaisPadrao,
} from "@/components/BarraFiltrosPedidos";
import { calcularUrgencia } from "@/lib/utils";
import Link from "next/link";

export default function CoordenadorDashboard() {
  const { data: session } = useSession();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<any | null>(null);
  const [modalReimprimir, setModalReimprimir] = useState<string | null>(null);
  const [obsReimpressao, setObsReimpressao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosPedidosState>({
    ...filtrosIniciaisPadrao,
    escopoStatus: "TODOS",
    ordenacao: "urgencia",
  });

  const user = session?.user as any;

  const carregar = async () => {
    if (!user?.id) return;
    const res = await fetch(`/api/pedidos?coordenador_id=${user.id}`);
    if (res.ok) {
      const lista = await res.json();
      setPedidos(lista);
      if (pedidoSelecionado) {
        setPedidoSelecionado(lista.find((p: any) => p.id === pedidoSelecionado.id) || null);
      }
    }
    setLoading(false);
  };

  const carregarProfessores = async () => {
    try {
      const res = await fetch("/api/admin/importar/professores");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setProfessores(data);
      }
    } catch {
      // ignora falha silenciosamente
    }
  };

  useEffect(() => {
    carregar();
    carregarProfessores();
  }, [user?.id]);

  const soliciarReimpressao = async () => {
    if (!obsReimpressao.trim()) return;
    setEnviando(true);
    await fetch(`/api/pedidos/${modalReimprimir}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reimprimir", obs_reimpressao: obsReimpressao }),
    });
    setModalReimprimir(null);
    setObsReimpressao("");
    setEnviando(false);
    carregar();
  };

  const pedidosFiltrados = useMemo(
    () => aplicarFiltrosEOrdenacao(pedidos, filtros),
    [pedidos, filtros]
  );

  const totalFolhasFiltradas = useMemo(
    () => pedidosFiltrados.reduce((acc, p) => acc + (p.folhas_necessarias || 0), 0),
    [pedidosFiltrados]
  );

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
        (a, b) => new Date(b.atualizado_em || b.criado_em).getTime() - new Date(a.atualizado_em || a.criado_em).getTime()
      ),
    }),
    [pedidosFiltrados]
  );

  const secoes = [
    { key: "URGENTE", label: "🔴 URGENTE — 0 a 2 dias", cor: "bg-red-50 border-red-200" },
    { key: "NO_PRAZO", label: "🟡 NO PRAZO — 3 a 5 dias", cor: "bg-yellow-50 border-yellow-200" },
    { key: "NOVO", label: "🟢 NOVOS — 6 a 7 dias", cor: "bg-green-50 border-green-200" },
    { key: "CONCLUIDO", label: "✅ CONCLUÍDOS", cor: "bg-gray-50 border-gray-200" },
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
      <div className="flex-1 overflow-y-auto p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meus Pedidos</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Olá, {user?.name}! Pesquise e filtre suas solicitações na fila ou já concluídas.
            </p>
          </div>
          <Link
            href="/coordenador/novo-pedido"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-sm transition-colors"
          >
            ➕ Novo Pedido
          </Link>
        </div>

        {/* Barra de Busca e Filtros */}
        <BarraFiltrosPedidos
          pedidosOriginais={pedidos}
          pedidosFiltradosCount={pedidosFiltrados.length}
          folhasFiltradasTotal={totalFolhasFiltradas}
          filtros={filtros}
          onChange={setFiltros}
          mostrarFiltroCoordenador={false}
          professoresCatalogo={professores}
          escopoPadrao="TODOS"
          ordenacaoPadrao="urgencia"
        />

        {loading ? (
          <div className="text-center py-16 text-gray-400">Carregando pedidos...</div>
        ) : pedidos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">📋</p>
            <p className="text-gray-500 text-lg font-medium">Nenhum pedido ainda</p>
            <Link
              href="/coordenador/novo-pedido"
              className="mt-4 inline-block px-5 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700"
            >
              Criar primeiro pedido
            </Link>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <p className="text-4xl mb-2">🔍</p>
            <p className="text-gray-700 font-semibold">Nenhum trabalho encontrado com esses filtros</p>
            <p className="text-gray-400 text-sm mt-1">
              Tente ajustar o período, o professor ou o termo pesquisado.
            </p>
          </div>
        ) : exibirListaUnicaOrdenada ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                Resultados ({pedidosFiltrados.length}) — {rotuloOrdenacao[filtros.ordenacao]}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pedidosFiltrados.map((pedido) => (
                <CardPedido
                  key={pedido.id}
                  pedido={pedido}
                  mostrarCoordenador={false}
                  selecionado={pedidoSelecionado?.id === pedido.id}
                  onClick={() => setPedidoSelecionado(pedido)}
                  onReimprimir={
                    pedido.status === "CONCLUIDO" ? () => setModalReimprimir(pedido.id) : undefined
                  }
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {secoes.map(({ key, label, cor }) => {
              const lista = grupos[key as keyof typeof grupos];
              if (lista.length === 0) return null;
              return (
                <div key={key}>
                  <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">
                    {label} <span className="text-gray-400">({lista.length})</span>
                  </h2>
                  <div className={`rounded-xl border p-4 ${cor}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {lista.map((pedido) => (
                        <CardPedido
                          key={pedido.id}
                          pedido={pedido}
                          mostrarCoordenador={false}
                          selecionado={pedidoSelecionado?.id === pedido.id}
                          onClick={() => setPedidoSelecionado(pedido)}
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

      {/* Painel Lateral de Detalhes do Pedido */}
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

              {pedidoSelecionado.status === "CONCLUIDO" && (
                <button
                  onClick={() => setModalReimprimir(pedidoSelecionado.id)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors text-sm"
                >
                  ↩ Solicitar Reimpressão
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
            <h2 className="text-lg font-bold text-gray-900 mb-2">Solicitar Reimpressão</h2>
            <p className="text-sm text-gray-500 mb-4">Por que você precisa reimprimir? (obrigatório)</p>
            <textarea
              rows={4}
              value={obsReimpressao}
              onChange={(e) => setObsReimpressao(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              placeholder="Ex: Avaliação atualizada com novas questões..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setModalReimprimir(null);
                  setObsReimpressao("");
                }}
                className="flex-1 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={soliciarReimpressao}
                disabled={enviando || !obsReimpressao.trim()}
                className="flex-1 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 font-semibold"
              >
                {enviando ? "Enviando..." : "↩ Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
