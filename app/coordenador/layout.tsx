"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { FotoAvatar } from "@/components/FotoAvatar";

const navItems = [
  { href: "/coordenador/dashboard", label: "Meus Pedidos", icon: "📋" },
  { href: "/coordenador/novo-pedido", label: "Novo Pedido", icon: "➕" },
];

export default function CoordenadorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-indigo-950 text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-indigo-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🖨️</span>
            <div>
              <p className="font-bold text-sm leading-tight">Fila de Impressão</p>
              <p className="text-indigo-400 text-xs">Coordenador</p>
            </div>
          </div>
        </div>

        {user && (
          <div className="p-4 border-b border-indigo-800 flex items-center gap-3">
            <FotoAvatar nome={user.name || ""} foto_url={user.foto_url} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-indigo-400 truncate">{user.email}</p>
            </div>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href ? "bg-indigo-600 text-white" : "text-indigo-200 hover:bg-indigo-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-indigo-800">
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-indigo-300 hover:bg-indigo-800 hover:text-white transition-colors">
            <span>🚪</span> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
