"use client";
import { useMemo } from "react";
import { format, subDays, startOfMonth } from "date-fns";

export type EscopoStatus = "TODOS" | "FILA" | "AGUARDANDO" | "EM_IMPRESSAO" | "CONCLUIDO";
export type OrdenacaoPedidos = "urgencia" | "recente" | "antigo" | "prazo" | "folhas";

export interface FiltrosPedidosState {
  busca: string;
  escopoStatus: EscopoStatus;
  ordenacao: OrdenacaoPedidos;
  professorId: string;
  coordenadorId: string;
  disciplinaNome: string;
  turmaNome: string;
  tipoAvaliacao: string;
  dataInicio: string;
  dataFim: string;
  apenasPrioritarios: boolean;
}

export const filtrosIniciaisPadrao: FiltrosPedidosState = {
  busca: "",
  escopoStatus: "TODOS",
  ordenacao: "urgencia",
  professorId: "",
  coordenadorId: "",
  disciplinaNome: "",
  turmaNome: "",
  tipoAvaliacao: "",
  dataInicio: "",
  dataFim: "",
  apenasPrioritarios: false,
};

interface OpcaoSimples {
  id: string;
  nome: string;
}

interface Props {
  pedidosOriginais: any[];
  pedidosFiltradosCount: number;
  folhasFiltradasTotal: number;
  filtros: FiltrosPedidosState;
  onChange: (novosFiltros: FiltrosPedidosState) => void;
  mostrarFiltroCoordenador?: boolean;
  coordenadores?: OpcaoSimples[];
  professoresCatalogo?: OpcaoSimples[];
  escopoPadrao?: EscopoStatus;
  ordenacaoPadrao?: OrdenacaoPedidos;
}

const tipoLabels: Record<string, string> = {
  TESTE: "Teste",
  PROVA: "Prova",
  OUTROS: "Outros",
};

export function aplicarFiltrosEOrdenacao(pedidos: any[], filtros: FiltrosPedidosState): any[] {
  const termo = filtros.busca.trim().toLowerCase();

  const filtrados = pedidos.filter((p) => {
    // 1. Escopo de status
    if (filtros.escopoStatus === "FILA") {
      if (p.status !== "AGUARDANDO" && p.status !== "EM_IMPRESSAO") return false;
    } else if (filtros.escopoStatus === "AGUARDANDO") {
      if (p.status !== "AGUARDANDO") return false;
    } else if (filtros.escopoStatus === "EM_IMPRESSAO") {
      if (p.status !== "EM_IMPRESSAO") return false;
    } else if (filtros.escopoStatus === "CONCLUIDO") {
      if (p.status !== "CONCLUIDO") return false;
    }

    // 2. Professor
    if (filtros.professorId) {
      const profId = p.professor_id || p.professor?.id;
      if (profId !== filtros.professorId && p.professor?.nome !== filtros.professorId) return false;
    }

    // 3. Coordenador
    if (filtros.coordenadorId) {
      const coordId = p.coordenador_id || p.coordenador?.id;
      if (coordId !== filtros.coordenadorId) return false;
    }

    // 4. Disciplina
    if (filtros.disciplinaNome && p.disciplina_nome !== filtros.disciplinaNome) {
      return false;
    }

    // 5. Turma
    if (filtros.turmaNome) {
      const temTurma = p.turmas?.some((t: any) => t.turma_nome === filtros.turmaNome);
      if (!temTurma) return false;
    }

    // 6. Tipo de Avaliação
    if (filtros.tipoAvaliacao && p.tipo_avaliacao !== filtros.tipoAvaliacao) {
      return false;
    }

    // 7. Apenas prioritários
    if (filtros.apenasPrioritarios && !p.prioridade) {
      return false;
    }

    // 8. Período específico (usa data de conclusão quando filtrando apenas concluídos, ou data de criação)
    if (filtros.dataInicio || filtros.dataFim) {
      const dataRefStr =
        filtros.escopoStatus === "CONCLUIDO" && p.atualizado_em
          ? p.atualizado_em
          : p.criado_em || p.atualizado_em;
      if (dataRefStr) {
        const dataRef = new Date(dataRefStr);
        if (filtros.dataInicio) {
          const inicio = new Date(`${filtros.dataInicio}T00:00:00.000`);
          if (dataRef < inicio) return false;
        }
        if (filtros.dataFim) {
          const fim = new Date(`${filtros.dataFim}T23:59:59.999`);
          if (dataRef > fim) return false;
        }
      }
    }

    // 9. Busca textual livre
    if (termo) {
      const profNome = (p.professor?.nome || "").toLowerCase();
      const discNome = (p.disciplina_nome || "").toLowerCase();
      const coordNome = (p.coordenador?.nome || "").toLowerCase();
      const obs = (p.observacao || "").toLowerCase();
      const obsReimp = (p.obs_reimpressao || "").toLowerCase();
      const tipo = (tipoLabels[p.tipo_avaliacao] || p.tipo_avaliacao || "").toLowerCase();
      const turmasStr = (p.turmas?.map((t: any) => t.turma_nome).join(" ") || "").toLowerCase();

      const match =
        profNome.includes(termo) ||
        discNome.includes(termo) ||
        coordNome.includes(termo) ||
        obs.includes(termo) ||
        obsReimp.includes(termo) ||
        tipo.includes(termo) ||
        turmasStr.includes(termo);

      if (!match) return false;
    }

    return true;
  });

  // Ordenação
  return [...filtrados].sort((a, b) => {
    const dataA = new Date(
      filtros.escopoStatus === "CONCLUIDO" ? a.atualizado_em || a.criado_em : a.criado_em || a.atualizado_em
    ).getTime();
    const dataB = new Date(
      filtros.escopoStatus === "CONCLUIDO" ? b.atualizado_em || b.criado_em : b.criado_em || b.atualizado_em
    ).getTime();

    if (filtros.ordenacao === "recente") {
      return dataB - dataA;
    }
    if (filtros.ordenacao === "antigo") {
      return dataA - dataB;
    }
    if (filtros.ordenacao === "prazo") {
      return new Date(a.prazo).getTime() - new Date(b.prazo).getTime();
    }
    if (filtros.ordenacao === "folhas") {
      return (b.folhas_necessarias || 0) - (a.folhas_necessarias || 0);
    }

    // Padrão ("urgencia"): Prioridade primeiro, depois mais antigo na fila (ou mais recente se concluído)
    if (a.prioridade !== b.prioridade) {
      return a.prioridade ? -1 : 1;
    }
    return dataA - dataB;
  });
}

export function BarraFiltrosPedidos({
  pedidosOriginais,
  pedidosFiltradosCount,
  folhasFiltradasTotal,
  filtros,
  onChange,
  mostrarFiltroCoordenador = false,
  coordenadores = [],
  professoresCatalogo = [],
  escopoPadrao = "TODOS",
  ordenacaoPadrao = "urgencia",
}: Props) {
  const atualizar = (parcial: Partial<FiltrosPedidosState>) => {
    onChange({ ...filtros, ...parcial });
  };

  // Contadores por status nos pedidos originais
  const contadores = useMemo(() => {
    const fila = pedidosOriginais.filter((p) => p.status === "AGUARDANDO" || p.status === "EM_IMPRESSAO").length;
    const aguardando = pedidosOriginais.filter((p) => p.status === "AGUARDANDO").length;
    const emImpressao = pedidosOriginais.filter((p) => p.status === "EM_IMPRESSAO").length;
    const concluidos = pedidosOriginais.filter((p) => p.status === "CONCLUIDO").length;
    return {
      TODOS: pedidosOriginais.length,
      FILA: fila,
      AGUARDANDO: aguardando,
      EM_IMPRESSAO: emImpressao,
      CONCLUIDO: concluidos,
    };
  }, [pedidosOriginais]);

  // Opções dinâmicas de professores, disciplinas e turmas
  const professoresOpcoes = useMemo(() => {
    const mapa = new Map<string, string>();
    professoresCatalogo.forEach((p) => mapa.set(p.id, p.nome));
    pedidosOriginais.forEach((p) => {
      const id = p.professor_id || p.professor?.id || p.professor?.nome;
      const nome = p.professor?.nome;
      if (id && nome) mapa.set(id, nome);
    });
    return Array.from(mapa.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [pedidosOriginais, professoresCatalogo]);

  const disciplinasOpcoes = useMemo(() => {
    const set = new Set<string>();
    pedidosOriginais.forEach((p) => {
      if (p.disciplina_nome) set.add(p.disciplina_nome);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [pedidosOriginais]);

  const turmasOpcoes = useMemo(() => {
    const set = new Set<string>();
    pedidosOriginais.forEach((p) => {
      p.turmas?.forEach((t: any) => {
        if (t.turma_nome) set.add(t.turma_nome);
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [pedidosOriginais]);

  const aplicarAtalhoPeriodo = (tipo: "hoje" | "7dias" | "30dias" | "mes") => {
    const hoje = new Date();
    const fimStr = format(hoje, "yyyy-MM-dd");
    let inicioStr = fimStr;

    if (tipo === "7dias") inicioStr = format(subDays(hoje, 7), "yyyy-MM-dd");
    else if (tipo === "30dias") inicioStr = format(subDays(hoje, 30), "yyyy-MM-dd");
    else if (tipo === "mes") inicioStr = format(startOfMonth(hoje), "yyyy-MM-dd");

    atualizar({ dataInicio: inicioStr, dataFim: fimStr });
  };

  const temFiltroAtivo =
    filtros.busca.trim() !== "" ||
    filtros.escopoStatus !== escopoPadrao ||
    filtros.ordenacao !== ordenacaoPadrao ||
    filtros.professorId !== "" ||
    filtros.coordenadorId !== "" ||
    filtros.disciplinaNome !== "" ||
    filtros.turmaNome !== "" ||
    filtros.tipoAvaliacao !== "" ||
    filtros.dataInicio !== "" ||
    filtros.dataFim !== "" ||
    filtros.apenasPrioritarios;

  const limparFiltros = () => {
    onChange({
      ...filtrosIniciaisPadrao,
      escopoStatus: escopoPadrao,
      ordenacao: ordenacaoPadrao,
    });
  };

  const abas: { key: EscopoStatus; label: string; icon: string }[] = [
    { key: "TODOS", label: "Todos (Fila + Concluídos)", icon: "🗂️" },
    { key: "FILA", label: "Na Fila (A concluir)", icon: "⏳" },
    { key: "AGUARDANDO", label: "Aguardando", icon: "🕒" },
    { key: "EM_IMPRESSAO", label: "Em Impressão", icon: "🖨️" },
    { key: "CONCLUIDO", label: "Concluídos", icon: "✅" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6 space-y-4">
      {/* Abas de Escopo: pesquisar na fila, nos concluídos ou em todos */}
      <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-3">
        {abas.map((aba) => {
          const ativo = filtros.escopoStatus === aba.key;
          const qtd = contadores[aba.key];
          return (
            <button
              key={aba.key}
              type="button"
              onClick={() => atualizar({ escopoStatus: aba.key })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                ativo
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span>{aba.icon}</span>
              <span>{aba.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                  ativo ? "bg-indigo-800 text-indigo-100" : "bg-white text-gray-600"
                }`}
              >
                {qtd}
              </span>
            </button>
          );
        })}
      </div>

      {/* Linha Principal: Busca livre + Ordenação */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-7 relative">
          <input
            type="text"
            placeholder="🔍 Pesquisar por professor, disciplina, turma, observação, avaliação..."
            value={filtros.busca}
            onChange={(e) => atualizar({ busca: e.target.value })}
            className="w-full pl-4 pr-9 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
          />
          {filtros.busca && (
            <button
              type="button"
              onClick={() => atualizar({ busca: "" })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
              title="Limpar busca"
            >
              ×
            </button>
          )}
        </div>

        <div className="md:col-span-5">
          <select
            value={filtros.ordenacao}
            onChange={(e) => atualizar({ ordenacao: e.target.value as OrdenacaoPedidos })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white font-medium text-gray-700 cursor-pointer"
          >
            <option value="urgencia">↕ Ordenar: Por Urgência / Prioridade (Fila)</option>
            <option value="recente">⬇ Ordenar: Do mais recente para o mais antigo</option>
            <option value="antigo">⬆ Ordenar: Do mais antigo para o mais recente</option>
            <option value="prazo">📅 Ordenar: Prazo de entrega mais próximo</option>
            <option value="folhas">📄 Ordenar: Maior quantidade de folhas</option>
          </select>
        </div>
      </div>

      {/* Linha de Filtros Específicos: Professor, Coordenador (se operador), Disciplina, Turma, Tipo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Professor */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Professor
          </label>
          <select
            value={filtros.professorId}
            onChange={(e) => atualizar({ professorId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white cursor-pointer"
          >
            <option value="">Todos os professores</option>
            {professoresOpcoes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Coordenador (apenas para Operador) */}
        {mostrarFiltroCoordenador && (
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Coordenador
            </label>
            <select
              value={filtros.coordenadorId}
              onChange={(e) => atualizar({ coordenadorId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white cursor-pointer"
            >
              <option value="">Todos os coordenadores</option>
              {coordenadores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Disciplina */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Disciplina
          </label>
          <select
            value={filtros.disciplinaNome}
            onChange={(e) => atualizar({ disciplinaNome: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white cursor-pointer"
          >
            <option value="">Todas as disciplinas</option>
            {disciplinasOpcoes.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Turma */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Turma
          </label>
          <select
            value={filtros.turmaNome}
            onChange={(e) => atualizar({ turmaNome: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white cursor-pointer"
          >
            <option value="">Todas as turmas</option>
            {turmasOpcoes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de Avaliação */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Tipo de Avaliação
          </label>
          <select
            value={filtros.tipoAvaliacao}
            onChange={(e) => atualizar({ tipoAvaliacao: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white cursor-pointer"
          >
            <option value="">Todos os tipos</option>
            <option value="TESTE">Teste</option>
            <option value="PROVA">Prova</option>
            <option value="OUTROS">Outros</option>
          </select>
        </div>
      </div>

      {/* Linha de Período Específico + Prioridade */}
      <div className="pt-2 border-t border-gray-100 flex flex-wrap items-end gap-3 justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Período: Data inicial
            </label>
            <input
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => atualizar({ dataInicio: e.target.value })}
              className="px-3 py-1.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Data final
            </label>
            <input
              type="date"
              value={filtros.dataFim}
              onChange={(e) => atualizar({ dataFim: e.target.value })}
              className="px-3 py-1.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            />
          </div>

          {/* Atalhos rápidos de período */}
          <div className="flex items-center gap-1.5 flex-wrap pb-0.5">
            <span className="text-xs text-gray-400 mr-1">Atalhos:</span>
            {[
              { id: "hoje", label: "Hoje" },
              { id: "7dias", label: "Últimos 7 dias" },
              { id: "30dias", label: "Últimos 30 dias" },
              { id: "mes", label: "Este mês" },
            ].map((at) => (
              <button
                key={at.id}
                type="button"
                onClick={() => aplicarAtalhoPeriodo(at.id as any)}
                className="px-2.5 py-1 text-xs font-medium bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 rounded-lg transition-colors cursor-pointer"
              >
                {at.label}
              </button>
            ))}
            {(filtros.dataInicio || filtros.dataFim) && (
              <button
                type="button"
                onClick={() => atualizar({ dataInicio: "", dataFim: "" })}
                className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg"
              >
                Limpar datas
              </button>
            )}
          </div>
        </div>

        {/* Toggle Prioritários */}
        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-yellow-50 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filtros.apenasPrioritarios}
            onChange={(e) => atualizar({ apenasPrioritarios: e.target.checked })}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-xs font-semibold text-gray-700">⭐ Apenas Prioritários</span>
        </label>
      </div>

      {/* Rodapé de resumo dos resultados e botão limpar filtros */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2 text-xs text-gray-500">
        <div>
          Exibindo <strong className="text-gray-800">{pedidosFiltradosCount}</strong> de{" "}
          <strong className="text-gray-800">{pedidosOriginais.length}</strong> trabalho(s) • Total nos resultados:{" "}
          <strong className="text-indigo-700">{folhasFiltradasTotal.toLocaleString("pt-BR")} folhas</strong>
        </div>

        {temFiltroAtivo && (
          <button
            type="button"
            onClick={limparFiltros}
            className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            ✕ Limpar todos os filtros
          </button>
        )}
      </div>
    </div>
  );
}
