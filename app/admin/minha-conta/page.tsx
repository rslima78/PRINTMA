"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";

export default function AdminMinhaContaPage() {
  const { data: session } = useSession();
  const [form, setForm] = useState({ senhaAtual: "", novaSenha: "", confirmarSenha: "" });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setSucesso(false);

    if (form.novaSenha !== form.confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    if (form.novaSenha.length < 6) {
      setErro("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setSalvando(true);
    try {
      const res = await fetch("/api/usuario/senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senhaAtual: form.senhaAtual, novaSenha: form.novaSenha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao alterar senha");
      setSucesso(true);
      setForm({ senhaAtual: "", novaSenha: "", confirmarSenha: "" });
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="p-8 max-w-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Minha Conta</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Conectado como <span className="font-medium text-gray-700">{session?.user?.name}</span>
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-lg">
            🔑
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Alterar Senha</h2>
            <p className="text-xs text-gray-500">Mantenha sua conta segura com uma senha forte</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha atual
            </label>
            <input
              id="senha-atual"
              type="password"
              required
              value={form.senhaAtual}
              onChange={(e) => setForm({ ...form, senhaAtual: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              placeholder="Digite sua senha atual"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nova senha
            </label>
            <input
              id="nova-senha"
              type="password"
              required
              minLength={6}
              value={form.novaSenha}
              onChange={(e) => setForm({ ...form, novaSenha: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar nova senha
            </label>
            <input
              id="confirmar-senha"
              type="password"
              required
              minLength={6}
              value={form.confirmarSenha}
              onChange={(e) => setForm({ ...form, confirmarSenha: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              placeholder="Repita a nova senha"
            />
          </div>

          {erro && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
              <span>⚠️</span> {erro}
            </div>
          )}

          {sucesso && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-xl">
              <span>✅</span> Senha alterada com sucesso!
            </div>
          )}

          <button
            id="btn-alterar-senha"
            type="submit"
            disabled={salvando}
            className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm mt-2"
          >
            {salvando ? "Salvando..." : "Alterar Senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
