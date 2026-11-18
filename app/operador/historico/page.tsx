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

export default function HistoricoPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [coordenadores, setCoordenadores] = useState<any[]>([]);
  const [professores, setProfessores] = useState<any[]>([]);
  const [estatisticas, setEstatisticas] = useState({
    semana: 0,
    mes: 0,
    ano: 0,
    periodo: null as number | null,
  });
  const [loading, setLoading] = useState(true);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<any | null>(null);
  const [dataInicioEstat, setDataInicioEstat] = useState("");
  const [dataFimEstat, setDataFimEstat] = useState("");
  const [calculando, setCalculando] = useState(false);
  const [modalReimprimir, setModalReimprimir] = useState<string | null>(null);
  const [obsReimpressao, setObsReimpressao] = useState("");
  const [filtros, setFiltros] = useState<FiltrosPedidosState>({
    ...filtrosIniciaisPadrao,
    escopoStatus: "CONCLUIDO",
    ordenacao: "recente",
  });

  const carregar = async () => {
    const [p, e] = await Promise.all([
      fetch("/api/pedidos").then((r) => r.json()),
      fetch("/api/estatisticas").then((r) => r.json()),
    ]);
    if (Array.isArray(p)) {
      setPedidos(p);
      if (pedidoSelecionado) {
        setPedidoSelecionado(p.find((item: any) => item.id === pedidoSelecionado.id) || null);
      }
    }
    setEstatisticas(e);
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

  const calcularPeriodo = async () => {
    setCalculando(true);
    const res = await fetch(`/api/estatisticas?inicio=${dataInicioEstat}&fim=${dataFimEstat}`);
    const data = await res.json();
    setEstatisticas((prev) => ({ ...prev, periodo: data.periodo }));
    // Também aplica o período no filtro de busca abaixo para facilitar a visualização dos trabalhos do período
    setFiltros((prev) => ({ ...prev, dataInicio: dataInicioEstat, dataFim: dataFimEstat }));
    setCalculando(false);
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
    alert("Pedido de reimpressão criado com prioridade!");
  };

  const pedidosFiltrados = useMemo(
    () => aplicarFiltrosEOrdenacao(pedidos, filtros),
    [pedidos, filtros]
  );

  const totalFolhasFiltradas = useMemo(
    () => pedidosFiltrados.reduce((acc, p) => acc + (p.folhas_necessarias || 0), 0),
    [pedidosFiltrados]
  );

  const rotuloOrdenacao: Record<string, string> = {
    recente: "Do mais recente para o mais antigo",
    antigo: "Do mais antigo para o mais recente",
    prazo: "Por prazo de entrega mais próximo",
    folhas: "Por maior quantidade de folhas",
    urgencia: "Por urgência e prioridade",
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Histórico e Busca de Impressões</h1>

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Esta Semana", valor: estatisticas.semana, cor: "text-blue-600" },
              { label: "Este Mês", valor: estatisticas.mes, cor: "text-indigo-600" },
              { label: "Este Ano", valor: estatisticas.ano, cor: "text-purple-600" },
              ...(estatisticas.periodo !== null
                ? [{ label: "Período Calculado", valor: estatisticas.periodo, cor: "text-orange-600" }]
                : [
                    {
                      label: "Total nos Resultados",
                      valor: totalFolhasFiltradas,
                      cor: "text-emerald-600",
                    },
                  ]),
            ].map(({ label, valor, cor }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                <p className={`text-3xl font-black mt-1 ${cor}`}>
                  {Number(valor).toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-gray-400">folhas</p>
              </div>
            ))}
          </div>

          {/* Seletor de Período para Estatísticas */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
            <h2 className="text-sm font-bold text-gray-700 mb-3">
              Calcular Consumo de Folhas por Período Personalizado
            </h2>
            <div className="flex gap-3 items-end flex-wrap">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data início</label>
                <input
                  type="date"
                  value={dataInicioEstat}
                  onChange={(e) => setDataInicioEstat(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data fim</label>
                <input
                  type="date"
                  value={dataFimEstat}
                  onChange={(e) => setDataFimEstat(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <button
                onClick={calcularPeriodo}
                disabled={!dataInicioEstat || !dataFimEstat || calculando}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {calculando ? "Calculando..." : "Calcular e Filtrar"}
              </button>
            </div>
          </div>

          {/* Ferramenta de Busca e Filtros (Concluídos e Na Fila) */}
          <BarraFiltrosPedidos
            pedidosOriginais={pedidos}
            pedidosFiltradosCount={pedidosFiltrados.length}
            folhasFiltradasTotal={totalFolhasFiltradas}
            filtros={filtros}
            onChange={setFiltros}
            mostrarFiltroCoordenador={true}
            coordenadores={coordenadores}
            professoresCatalogo={professores}
            escopoPadrao="CONCLUIDO"
            ordenacaoPadrao="recente"
          />

          {/* Lista de resultados */}
          {loading ? (
            <div className="text-center py-16 text-gray-400">Carregando...</div>
          ) : (
            <div>
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">
                Trabalhos Encontrados ({pedidosFiltrados.length}) —{" "}
                <span className="text-gray-400 font-normal">
                  {rotuloOrdenacao[filtros.ordenacao]}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pedidosFiltrados.map((p) => (
                  <CardPedido
                    key={p.id}
                    pedido={p}
                    mostrarCoordenador
                    selecionado={pedidoSelecionado?.id === p.id}
                    onClick={() => setPedidoSelecionado(p)}
                    onReimprimir={
                      p.status === "CONCLUIDO" ? () => setModalReimprimir(p.id) : undefined
                    }
                  />
                ))}
                {pedidosFiltrados.length === 0 && (
                  <div className="col-span-2 text-center py-16 bg-white rounded-2xl border border-gray-200 text-gray-400">
                    <p className="text-4xl mb-2">🔍</p>
                    <p className="text-gray-600 font-semibold">
                      Nenhum trabalho encontrado para os critérios selecionados
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Altere os filtros acima ou alterne entre Concluídos e Na Fila.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Painel Lateral de Detalhes */}
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
