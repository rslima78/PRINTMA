"use client";
import { useEffect, useState } from "react";
import { FotoAvatar } from "@/components/FotoAvatar";

interface Coordenador {
  id: string;
  nome: string;
  email: string;
  foto_url?: string;
  ativo: boolean;
}

export default function CoordenadoresPage() {
  const [coordenadores, setCoordenadores] = useState<Coordenador[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", senha: "" });
  const [foto, setFoto] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = async () => {
    const res = await fetch("/api/admin/coordenadores");
    const data = await res.json();
    setCoordenadores(data);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      let foto_url = "";
      if (foto) {
        const fd = new FormData();
        fd.append("file", foto);
        const res = await fetch("/api/upload-imagem", { method: "POST", body: fd });
        const data = await res.json();
        foto_url = data.url;
      }
      const res = await fetch("/api/admin/coordenadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, foto_url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setModal(false);
      setForm({ nome: "", email: "", senha: "" });
      setFoto(null);
      carregar();
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    await fetch("/api/admin/coordenadores", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ativo: !ativo }),
    });
    carregar();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coordenadores</h1>
          <p className="text-gray-500 text-sm mt-0.5">{coordenadores.length} cadastrado(s)</p>
        </div>
        <button
          id="btn-novo-coordenador"
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          + Novo Coordenador
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin text-4xl">⏳</div></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coordenadores.map((c) => (
            <div key={c.id} className={`bg-white rounded-xl border p-5 shadow-sm flex items-center gap-4 ${!c.ativo ? "opacity-60" : ""}`}>
              <FotoAvatar nome={c.nome} foto_url={c.foto_url} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{c.nome}</p>
                <p className="text-sm text-gray-500 truncate">{c.email}</p>
                <div className="mt-2">
                  <button
                    onClick={() => toggleAtivo(c.id, c.ativo)}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                      c.ativo
                        ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {c.ativo ? "✓ Ativo" : "○ Inativo"}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {coordenadores.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <p className="text-4xl mb-2">👤</p>
              <p>Nenhum coordenador cadastrado</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Novo Coordenador</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  required
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="email@escola.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <input
                  type="password"
                  required
                  value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto (opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFoto(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-600"
                />
              </div>
              {erro && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{erro}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setModal(false); setErro(""); }}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium disabled:opacity-50"
                >
                  {salvando ? "Salvando..." : "Cadastrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
