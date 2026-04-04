"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { data: session } = useSession();

  const cards = [
    { href: "/admin/coordenadores", icon: "👤", label: "Coordenadores", desc: "Gerenciar usuários coordenadores" },
    { href: "/admin/disciplinas", icon: "📚", label: "Disciplinas", desc: "Cadastrar disciplinas" },
    { href: "/admin/professores", icon: "🧑‍🏫", label: "Professores", desc: "Cadastrar professores" },
    { href: "/admin/turmas", icon: "🏫", label: "Turmas", desc: "Cadastrar turmas e nº de alunos" },
    { href: "/admin/associacoes", icon: "🔗", label: "Associações", desc: "Vincular professor → disciplina → turmas" },
    { href: "/admin/pedidos", icon: "🗑️", label: "Apagar Pedidos", desc: "Excluir pedidos de impressão" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
        <p className="text-gray-500 mt-1">Bem-vindo, {session?.user?.name || "Administrador"}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group"
          >
            <div className="text-3xl mb-3">{card.icon}</div>
            <h2 className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{card.label}</h2>
            <p className="text-sm text-gray-500 mt-1">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
