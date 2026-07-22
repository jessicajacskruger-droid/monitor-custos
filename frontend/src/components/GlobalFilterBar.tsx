import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { getFiltrosOpcoes } from "../services/api";
import { useGlobalFilters } from "../context/GlobalFiltersContext";
import type { FiltrosOpcoes } from "../types";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function GlobalFilterBar() {
  const { globalFilters, setGlobalFilters } = useGlobalFilters();
  const [opcoes, setOpcoes] = useState<FiltrosOpcoes>({ tiposMaterial: [], centros: [], categoriasContabeis: [] });
  
  useEffect(() => {
    getFiltrosOpcoes().then(setOpcoes).catch(() => {});
  }, []);

  function set(key: keyof typeof globalFilters, value: string) {
    setGlobalFilters({ ...globalFilters, [key]: value || undefined });
  }

  const temFiltro = globalFilters.mes || globalFilters.ano || globalFilters.tipoMaterial || globalFilters.centro || globalFilters.categoriaContabil;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-brand-100 bg-white p-4 shadow-card">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase text-brand-700">
        <CalendarDays size={14} /> Filtros gerais
      </span>

      <select
        value={globalFilters.mes || ""}
        onChange={(e) => set("mes", e.target.value)}
        className="rounded-lg border border-surface-muted bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
      >
        <option value="">Todos os meses</option>
        {MESES.map((nome, i) => (
          <option key={i + 1} value={i + 1}>
            {nome}
          </option>
        ))}
      </select>

      <input
  type="number"
  placeholder="Ano"
  value={globalFilters.ano || ""}
  onChange={(e) => set("ano", e.target.value)}
  className="w-24 rounded-lg border border-surface-muted bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
/>
      <select
        value={globalFilters.tipoMaterial || ""}
        onChange={(e) => set("tipoMaterial", e.target.value)}
        className="rounded-lg border border-surface-muted bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
      >
        <option value="">Todos os TMat</option>
        {opcoes.tiposMaterial.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <select
        value={globalFilters.centro || ""}
        onChange={(e) => set("centro", e.target.value)}
        className="rounded-lg border border-surface-muted bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
      >
        <option value="">Todos os Centros</option>
        {opcoes.centros.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
  value={globalFilters.categoriaContabil || ""}
  onChange={(e) => set("categoriaContabil", e.target.value)}
  className="rounded-lg border border-surface-muted bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
>
  <option value="">Todas as Categorias</option>
  {opcoes.categoriasContabeis.map((c) => (
    <option key={c} value={c}>
      {c}
    </option>
  ))}
</select>

      {temFiltro && (
        <button onClick={() => setGlobalFilters({})} className="text-sm font-medium text-danger-600 hover:underline">
          Limpar filtros gerais
        </button>
      )}
    </div>
  );
}
