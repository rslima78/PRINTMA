"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        senha,
        redirect: false,
      });
      if (result?.error) {
        setErro("E-mail ou senha incorretos");
      } else {
        // Buscar sessão para redirecionar corretamente
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        const perfil = session?.user?.perfil;
        if (perfil === "ADMIN") router.push("/admin/dashboard");
        else if (perfil === "COORDENADOR") router.push("/coordenador/dashboard");
        else if (perfil === "OPERADOR") router.push("/operador/dashboard");
        else router.push("/");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 border border-white/20">
            <span className="text-3xl">🖨️</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Fila de Impressão</h1>
          <p className="text-indigo-300 mt-1 text-sm">Sistema de Gerenciamento de Avaliações</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-2xl">
          <h2 className="text-white text-xl font-semibold mb-6">Entrar na sua conta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-indigo-200 text-sm font-medium mb-1.5">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-indigo-200 text-sm font-medium mb-1.5">Senha</label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all"
              />
            </div>

            {erro && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3">
                <p className="text-red-200 text-sm text-center">{erro}</p>
              </div>
            )}

            <button
              id="btn-login"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-60 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Entrando...
                </span>
              ) : "Entrar"}
            </button>
          </form>
        </div>

        <p className="text-center text-indigo-400 text-xs mt-6">
          Escola Municipal Maria Anita • Fila de Impressão v1.0
        </p>
      </div>
    </div>
  );
}
