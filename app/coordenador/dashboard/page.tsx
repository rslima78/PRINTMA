"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CardPedido } from "@/components/CardPedido";
import { calcularUrgencia } from "@/lib/utils";
import Link from "next/link";

export default function CoordenadorDashboard() {
  const { data: session } = useSession();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalReimprimir, setModalReimprimir] = useState<string | null>(null);
  const [obsReimpressao, setObsReimpressao] = useState("");
  const [enviando, setEnviando] = useState(false);

  const user = session?.user as any;

  const carregar = async () => {
    if (!user?.id) return;
    const res = await fetch(`/api/pedidos?coordenador_id=${user.id}`);
    setPedidos(await res.json());
    setLoading(false);
  };

  useEffect(() => { carregar(); }, [user?.id]);

  const soliciarReimpressao = async () => {
    if (!obsReimpressao.trim()) return;
    setEnviando(true);
    await fetch(`/api/pedidos/${modalReimprimir}/reimprimir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ obs_reimpressao: obsReimpressao }),
    });
    setModalReimprimir(null);
    setObsReimpressao("");
    setEnviando(false);
    carregar();
  };

  const grupos = {
    URGENTE: pedidos.filter((p) => p.status !== "CONCLUIDO" && p.status !== "CANCELADO" && calcularUrgencia(p.prazo) === "URGENTE"),
    NO_PRAZO: pedidos.filter((p) => p.status !== "CONCLUIDO" && p.status !== "CANCELADO" && calcularUrgencia(p.prazo) === "NO_PRAZO"),
    NOVO: pedidos.filter((p) => p.status !== "CONCLUIDO" && p.status !== "CANCELADO" && calcularUrgencia(p.prazo) === "NOVO"),
    CONCLUIDO: pedidos.filter((p) => p.status === "CONCLUIDO"),
    CANCELADO: pedidos.filter((p) => p.status === "CANCELADO"),
  };

  const secoes = [
    { key: "URGENTE", label: "🔴 URGENTE — 0 a 2 dias", cor: "bg-red-50 border-red-200" },
    { key: "NO_PRAZO", label: "🟡 NO PRAZO — 3 a 5 dias", cor: "bg-yellow-50 border-yellow-200" },
    { key: "NOVO", label: "🟢 NOVOS — 6 a 7 dias", cor: "bg-green-50 border-green-200" },
    { key: "CONCLUIDO", label: "✅ CONCLUÍDOS", cor: "bg-gray-50 border-gray-200" },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Pedidos</h1>
          <p className="text-gray-500 text-sm mt-0.5">Olá, {user?.name}! Confira suas solicitações abaixo.</p>
        </div>
        <Link href="/coordenador/novo-pedido"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-sm transition-colors">
          ➕ Novo Pedido
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando pedidos...</div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-3">📋</p>
          <p className="text-gray-500 text-lg font-medium">Nenhum pedido ainda</p>
          <Link href="/coordenador/novo-pedido" className="mt-4 inline-block px-5 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">
            Criar primeiro pedido
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {secoes.map(({ key, label, cor }) => {
            const lista = grupos[key as keyof typeof grupos];
            if (lista.length === 0) return null;
            return (
              <div key={key}>
                <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">{label}</h2>
                <div className={`rounded-xl border p-4 ${cor}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {lista.map((pedido) => (
                      <CardPedido
                        key={pedido.id}
                        pedido={pedido}
                        mostrarCoordenador={false}
                        onReimprimir={pedido.status === "CONCLUIDO" ? () => setModalReimprimir(pedido.id) : undefined}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
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
              <button onClick={() => { setModalReimprimir(null); setObsReimpressao(""); }}
                className="flex-1 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={soliciarReimpressao}
                disabled={enviando || !obsReimpressao.trim()}
                className="flex-1 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 font-semibold">
                {enviando ? "Enviando..." : "↩ Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
