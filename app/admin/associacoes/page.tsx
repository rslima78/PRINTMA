"use client";
import { useEffect, useState } from "react";

interface Professor { id: string; nome: string; }
interface Disciplina { id: string; nome: string; }
interface Turma { id: string; nome: string; num_estudantes: number; }
interface Associacao {
  id: string;
  professor: Professor;
  disciplina: Disciplina;
  turmas: { turma: Turma }[];
}

export default function AssociacoesPage() {
  const [associacoes, setAssociacoes] = useState<Associacao[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ professor_id: "", disciplina_id: "", turma_ids: [] as string[] });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [msg, setMsg] = useState("");

  const carregar = async () => {
    const [assoc, profs, discs, turm] = await Promise.all([
      fetch("/api/admin/associacoes").then((r) => r.json()),
      fetch("/api/admin/importar/professores").then((r) => r.json()),
      fetch("/api/admin/importar/disciplinas").then((r) => r.json()),
      fetch("/api/admin/importar/turmas").then((r) => r.json()),
    ]);
    setAssociacoes(assoc);
    setProfessores(profs);
    setDisciplinas(discs);
    setTurmas(turm);
  };

  useEffect(() => { carregar(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.turma_ids.length === 0) { setErro("Selecione pelo menos uma turma"); return; }
    setSalvando(true);
    setErro("");
    try {
      const res = await fetch("/api/admin/associacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setModal(false);
      setForm({ professor_id: "", disciplina_id: "", turma_ids: [] });
      setMsg("Associação criada com sucesso!");
      carregar();
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (id: string) => {
    if (!confirm("Excluir associação?")) return;
    await fetch(`/api/admin/associacoes/${id}`, { method: "DELETE" });
    setMsg("Associação removida.");
    carregar();
  };

  const toggleTurma = (id: string) => {
    setForm((f) => ({
      ...f,
      turma_ids: f.turma_ids.includes(id) ? f.turma_ids.filter((t) => t !== id) : [...f.turma_ids, id],
    }));
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Associações</h1>
          <p className="text-gray-500 text-sm mt-0.5">Professor → Disciplina → Turma(s)</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          + Nova Associação
        </button>
      </div>

      {msg && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">{msg}</div>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {associacoes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">🔗</p>
            <p>Nenhuma associação criada</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Professor</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Disciplina</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Turmas</th>
                <th className="w-24 px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {associacoes.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm font-medium text-gray-800">{a.professor.nome}</td>
                  <td className="px-6 py-3 text-sm text-indigo-700 font-medium">{a.disciplina.nome}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{a.turmas.map((t) => t.turma.nome).join(", ")}</td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => excluir(a.id)} className="text-xs text-red-500 hover:text-red-700">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Nova Associação</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Professor</label>
                <select
                  required
                  value={form.professor_id}
                  onChange={(e) => setForm({ ...form, professor_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">Selecione...</option>
                  {professores.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina</label>
                <select
                  required
                  value={form.disciplina_id}
                  onChange={(e) => setForm({ ...form, disciplina_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">Selecione...</option>
                  {disciplinas.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Turmas (selecione uma ou mais)</label>
                <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-2">
                  {turmas.map((t) => (
                    <label key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.turma_ids.includes(t.id)}
                        onChange={() => toggleTurma(t.id)}
                        className="rounded border-gray-300 text-indigo-600"
                      />
                      <span className="text-sm text-gray-700">{t.nome}</span>
                      <span className="text-xs text-gray-400 ml-auto">{t.num_estudantes} alunos</span>
                    </label>
                  ))}
                </div>
              </div>
              {erro && <p className="text-sm text-red-600">{erro}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => { setModal(false); setErro(""); }} className="flex-1 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={salvando} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                  {salvando ? "Salvando..." : "Criar Associação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
