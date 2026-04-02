"use client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FotoAvatar } from "./FotoAvatar";
import { StatusBadge } from "./StatusBadge";
import { UrgenciaBadge } from "./UrgenciaBadge";

const tipoLabels: Record<string, string> = { TESTE: "Teste", PROVA: "Prova", OUTROS: "Outros" };

interface Props {
  pedido: any;
}

export function ResumoPedido({ pedido }: Props) {
  const rows = [
    ["Tipo de Avaliação", tipoLabels[pedido.tipo_avaliacao] || pedido.tipo_avaliacao],
    ["Disciplina", pedido.disciplina_nome],
    ["Professor", pedido.professor?.nome || pedido.professor_nome],
    ["Turma(s)", pedido.turmas?.map((t: any) => t.turma_nome).join(", ")],
    ["Nº de Cópias", pedido.num_copias],
    ["Folhas Necessárias", pedido.folhas_necessarias],
    ["Prazo de Entrega", format(new Date(pedido.prazo), "dd/MM/yyyy", { locale: ptBR })],
    ["Observação", pedido.observacao || "—"],
  ];

  return (
    <div className="space-y-3">
      {pedido.coordenador && (
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <FotoAvatar nome={pedido.coordenador.nome} foto_url={pedido.coordenador.foto_url} size="sm" />
          <div>
            <p className="text-xs text-gray-500">Solicitado por</p>
            <p className="text-sm font-semibold text-gray-800">{pedido.coordenador.nome}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between items-start py-1.5 border-b border-gray-50">
            <span className="text-xs font-medium text-gray-500 w-36 shrink-0">{label}</span>
            <span className="text-sm text-gray-800 text-right font-medium">{String(value ?? "—")}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2 flex-wrap">
        <UrgenciaBadge prazo={pedido.prazo} />
        <StatusBadge status={pedido.status} />
        {pedido.prioridade && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 border border-yellow-300 text-yellow-700">
            ⭐ Prioritário
          </span>
        )}
      </div>

      {pedido.obs_reimpressao && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-orange-700">↩ Justificativa de Reimpressão</p>
          <p className="text-sm text-orange-800 mt-1">{pedido.obs_reimpressao}</p>
        </div>
      )}
    </div>
  );
}
