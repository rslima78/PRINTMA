"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/operador/dashboard", label: "Fila de Impressão", icon: "🖨️" },
  { href: "/operador/historico", label: "Histórico", icon: "📊" },
];

export default function OperadorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-xl">🖨️</span>
            <div>
              <p className="font-bold text-sm leading-tight">Fila de Impressão</p>
              <p className="text-slate-400 text-xs">Operador</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-700">
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
            <span>🚪</span> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
