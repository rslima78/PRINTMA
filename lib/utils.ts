import { StatusPedido } from "@prisma/client";
import { differenceInDays } from "date-fns";

// Calcula folhas necessarias: ceil(paginas/2) * copias
export function calcularFolhas(paginas: number, copias: number): number {
  return Math.ceil(paginas / 2) * copias;
}

// Calcula prazo: data + 7 dias
export function calcularPrazo(base: Date = new Date()): Date {
  const prazo = new Date(base);
  prazo.setDate(prazo.getDate() + 7);
  return prazo;
}

// Calcula urgencia com base nos dias restantes ate o prazo
export type Urgencia = "URGENTE" | "NO_PRAZO" | "NOVO" | "VENCIDO";

export function calcularUrgencia(prazo: Date): Urgencia {
  const dias = differenceInDays(new Date(prazo), new Date());
  if (dias < 0) return "VENCIDO";
  if (dias <= 2) return "URGENTE";
  if (dias <= 5) return "NO_PRAZO";
  return "NOVO";
}

export function diasRestantes(prazo: Date): number {
  return differenceInDays(new Date(prazo), new Date());
}

export const urgenciaCores: Record<Urgencia, string> = {
  URGENTE: "bg-red-100 border-red-300 text-red-800",
  NO_PRAZO: "bg-yellow-100 border-yellow-300 text-yellow-800",
  NOVO: "bg-green-100 border-green-300 text-green-800",
  VENCIDO: "bg-gray-100 border-gray-300 text-gray-600",
};

export const statusLabels: Record<StatusPedido, string> = {
  AGUARDANDO: "Aguardando",
  EM_IMPRESSAO: "Em Impressão",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

export const statusCores: Record<StatusPedido, string> = {
  AGUARDANDO: "bg-blue-100 text-blue-700",
  EM_IMPRESSAO: "bg-orange-100 text-orange-700",
  CONCLUIDO: "bg-green-100 text-green-700",
  CANCELADO: "bg-gray-100 text-gray-500",
};
