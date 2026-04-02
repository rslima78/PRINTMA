"use client";
import { StatusBadge } from "./StatusBadge";
import { UrgenciaBadge } from "./UrgenciaBadge";
import { FotoAvatar } from "./FotoAvatar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PedidoTurma {
  turma_nome: string;
  num_estudantes: number;
}

interface Pedido {
  id: string;
  tipo_avaliacao: string;
  disciplina_nome: string;
  professor: { nome: string };
  coordenador: { nome: string; foto_url?: string };
  turmas: PedidoTurma[];
  num_copias: number;
  folhas_necessarias: number;
  prazo: string;
  status: any;
  prioridade: boolean;
  obs_reimpressao?: string;
}

interface Props {
  pedido: Pedido;
  onClick?: () => void;
  onPrioridadeToggle?: () => void;
  onReimprimir?: () => void;
  mostrarCoordenador?: boolean;
}

const tipoLabels: Record<string, string> = {
  TESTE: "Teste",
  PROVA: "Prova",
  OUTROS: "Outros",
};

export function CardPedido({ pedido, onClick, onPrioridadeToggle, onReimprimir, mostrarCoordenador = true }: Props) {
  const turmasNomes = pedido.turmas.map((t) => t.turma_nome).join(", ");

  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer p-4 ${
        pedido.prioridade ? "border-yellow-400 ring-1 ring-yellow-300" : "border-gray-200"
      }`}
    >
      {pedido.prioridade && (
        <span className="absolute top-2 right-2 text-yellow-500 text-lg" title="Prioritário">⭐</span>
      )}

      <div className="flex items-start gap-3">
        {mostrarCoordenador && (
          <FotoAvatar nome={pedido.coordenador.nome} foto_url={pedido.coordenador.foto_url} size="sm" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{tipoLabels[pedido.tipo_avaliacao]}</span>
            <span className="text-gray-400 text-xs">•</span>
            <span className="text-sm text-indigo-700 font-medium">{pedido.disciplina_nome}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Prof. {pedido.professor.nome}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{turmasNomes}</p>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs text-gray-600">📄 {pedido.folhas_necessarias} folhas</span>
            <span className="text-xs text-gray-600">🖨️ {pedido.num_copias} cópias</span>
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <UrgenciaBadge prazo={pedido.prazo} />
            <StatusBadge status={pedido.status} />
          </div>

          {pedido.status === "CONCLUIDO" && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-lg">
                ✅ IMPRESSO — ENVIADO PARA SECRETARIA
              </span>
            </div>
          )}

          {pedido.obs_reimpressao && (
            <p className="text-xs text-orange-600 mt-1 italic">↩ Reimpressão: {pedido.obs_reimpressao}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
        {onPrioridadeToggle && pedido.status !== "CONCLUIDO" && pedido.status !== "CANCELADO" && (
          <button
            onClick={onPrioridadeToggle}
            className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
              pedido.prioridade
                ? "bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            ⭐ {pedido.prioridade ? "Remover Priority" : "Marcar Priority"}
          </button>
        )}
        {onReimprimir && pedido.status === "CONCLUIDO" && (
          <button
            onClick={onReimprimir}
            className="text-xs px-2 py-1 rounded-lg border bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 transition-colors"
          >
            ↩ Solicitar Reimpressão
          </button>
        )}
      </div>
    </div>
  );
}
