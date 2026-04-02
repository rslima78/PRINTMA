"use client";

interface Props {
  status: string;
  className?: string;
}

const statusCores: Record<string, string> = {
  AGUARDANDO: "bg-blue-100 text-blue-700",
  EM_IMPRESSAO: "bg-orange-100 text-orange-700",
  CONCLUIDO: "bg-green-100 text-green-700",
  CANCELADO: "bg-gray-100 text-gray-500",
};

const statusLabels: Record<string, string> = {
  AGUARDANDO: "Aguardando",
  EM_IMPRESSAO: "Em Impressão",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

export function StatusBadge({ status, className = "" }: Props) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusCores[status] || "bg-gray-100 text-gray-500"} ${className}`}>
      {statusLabels[status] || status}
    </span>
  );
}
