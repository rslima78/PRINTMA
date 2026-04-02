"use client";
import { calcularUrgencia, diasRestantes, urgenciaCores } from "@/lib/utils";

interface Props {
  prazo: string | Date;
  className?: string;
}

export function UrgenciaBadge({ prazo, className = "" }: Props) {
  const urgencia = calcularUrgencia(new Date(prazo));
  const dias = diasRestantes(new Date(prazo));
  const cores = urgenciaCores[urgencia];

  const labels: Record<string, string> = {
    URGENTE: "URGENTE",
    NO_PRAZO: "NO PRAZO",
    NOVO: "NOVO",
    VENCIDO: "VENCIDO",
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${cores} ${className}`}>
      {urgencia === "URGENTE" && "🔴"}
      {urgencia === "NO_PRAZO" && "🟡"}
      {urgencia === "NOVO" && "🟢"}
      {urgencia === "VENCIDO" && "⚫"}
      {labels[urgencia]} — {dias >= 0 ? `${dias}d` : "Vencido"}
    </span>
  );
}
