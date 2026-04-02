"use client";
import { useEffect, useState } from "react";
import { CardPedido } from "@/components/CardPedido";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function HistoricoPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [estatisticas, setEstatisticas] = useState({ semana: 0, mes: 0, ano: 0, periodo: null as number | null });
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [calculando, setCalculando] = useState(false);
  const [modalReimprimir, setModalReimprimir] = useState<string | null>(null);
  const [obsReimpressao, setObsReimpressao] = useState("");

  const carregar = async () => {
    const [p, e] = await Promise.all([
      fetch("/api/pedidos?status=CONCLUIDO").then((r) => r.json()),
      fetch("/api/estatisticas").then((r) => r.json()),
    ]);
    setPedidos(p.sort((a: any, b: any) => new Date(b.atualizado_em).getTime() - new Date(a.atualizado_em).getTime()));
    setEstatisticas(e);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const calcularPeriodo = async () => {
    setCalculando(true);
    const res = await fetch(`/api/estatisticas?inicio=${dataInicio}&fim=${dataFim}`);
    const data = await res.json();
    setEstatisticas((prev) => ({ ...prev, periodo: data.periodo }));
    setCalculando(false);
  };

  const reimprimir = async () => {
    if (!obsReimpressao.trim()) return;
    await fetch(`/api/pedidos/${modalReimprimir}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reimprimir", obs_reimpressao: obsReimpressao }),
    });
    setModalReimprimir(null);
    setObsReimpressao("");
    alert("Pedido de reimpressão criado com prioridade!");
  };

  const resultadoBusca = busca.trim()
    ? pedidos.filter((p) => p.professor.nome.toLowerCase().includes(busca.toLowerCase()))
    : [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Histórico de Impressões</h1>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Esta Semana", valor: estatisticas.semana, cor: "text-blue-600" },
          { label: "Este Mês", valor: estatisticas.mes, cor: "text-indigo-600" },
          { label: "Este Ano", valor: estatisticas.ano, cor: "text-purple-600" },
          ...(estatisticas.periodo !== null ? [{ label: "Período", valor: estatisticas.periodo, cor: "text-orange-600" }] : []),
        ].map(({ label, valor, cor }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`text-3xl font-black mt-1 ${cor}`}>{Number(valor).toLocaleString("pt-BR")}</p>
            <p className="text-xs text-gray-400">folhas</p>
          </div>
        ))}
      </div>

      {/* Seletor de Período */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <h2 className="text-sm font-bold text-gray-700 mb-3">Calcular por Período Personalizado</h2>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data início</label>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data fim</label>
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <button
            onClick={calcularPeriodo}
            disabled={!dataInicio || !dataFim || calculando}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {calculando ? "Calculando..." : "Calcular"}
          </button>
        </div>
      </div>

      {/* Busca por Professor */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="🔍 Buscar concluídos por professor..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        />
        {resultadoBusca.length > 0 && (
          <div className="mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {resultadoBusca.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{p.professor.nome}</p>
                  <p className="text-xs text-gray-400">{p.disciplina_nome} • {format(new Date(p.atualizado_em), "dd/MM/yyyy")}</p>
                </div>
                <button onClick={() => setModalReimprimir(p.id)}
                  className="text-xs px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-medium">
                  ↩ Reimprimir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista de concluídos */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : (
        <div>
          <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">Pedidos Concluídos ({pedidos.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pedidos.map((p) => (
              <CardPedido
                key={p.id}
                pedido={p}
                mostrarCoordenador
                onReimprimir={() => setModalReimprimir(p.id)}
              />
            ))}
            {pedidos.length === 0 && (
              <div className="col-span-2 text-center py-16 text-gray-400">
                <p className="text-4xl mb-2">📊</p>
                <p>Nenhuma impressão concluída ainda</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Reimpressão */}
      {modalReimprimir && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Reimprimir Pedido</h2>
            <textarea rows={3} value={obsReimpressao} onChange={(e) => setObsReimpressao(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              placeholder="Motivo da reimpressão (obrigatório)..." />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setModalReimprimir(null); setObsReimpressao(""); }}
                className="flex-1 py-2 border border-gray-300 rounded-xl text-gray-700">Cancelar</button>
              <button onClick={reimprimir} disabled={!obsReimpressao.trim()}
                className="flex-1 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
