import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { VariationFilters } from "../types";

interface Props {
  filters: VariationFilters;
  onChange: (filters: VariationFilters) => void;
}

const JUSTIFICATIVA_OPTIONS: { value: VariationFilters["justificativa"]; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "sem", label: "Sem justificativa" },
  { value: "com", label: "Com justificativa" },
];

export default function FilterBar({ filters, onChange }: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  function set<K extends keyof VariationFilters>(key: K, value: VariationFilters[K]) {
    onChange({ ...filters, [key]: value, page: 1 });
  }
  function clearAll() {
    onChange({ page: 1, pageSize: filters.pageSize, sortBy: filters.sortBy, sortDir: filters.sortDir });
  }

  const activeCount = Object.entries(filters).filter(
    ([k, v]) => !["page", "pageSize", "sortBy", "sortDir"].includes(k) && v
  ).length;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" size={16} />
          <input
            value={filters.busca || ""}
            onChange={(e) => set("busca", e.target.value)}
            placeholder="Buscar por código, material ou fornecedor..."
            className="w-full rounded-lg border border-surface-muted bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-400 focus:bg-white"
          />
        </div>

        <select
          value={filters.justificativa || "todos"}
          onChange={(e) => set("justificativa", e.target.value as any)}
          className="rounded-lg border border-surface-muted bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
        >
          {JUSTIFICATIVA_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => setAdvancedOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-surface-muted px-3 py-2 text-sm font-medium text-navy-700 hover:bg-surface"
        >
          <SlidersHorizontal size={15} />
          Mais filtros
        </button>

        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-danger-600 hover:bg-danger-50"
          >
            <X size={15} />
            Limpar ({activeCount})
          </button>
        )}
      </div>

      {advancedOpen && (
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-surface-muted pt-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-500">Código do Material</label>
            <input
              value={filters.material || ""}
              onChange={(e) => set("material", e.target.value)}
              className="w-full rounded-lg border border-surface-muted bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-500">Descrição</label>
            <input
              value={filters.descricao || ""}
              onChange={(e) => set("descricao", e.target.value)}
              className="w-full rounded-lg border border-surface-muted bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-500">Fornecedor</label>
            <input
              value={filters.fornecedor || ""}
              onChange={(e) => set("fornecedor", e.target.value)}
              className="w-full rounded-lg border border-surface-muted bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-500">Conta Fornecedor</label>
            <input
              value={filters.contaFornecedor || ""}
              onChange={(e) => set("contaFornecedor", e.target.value)}
              className="w-full rounded-lg border border-surface-muted bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-500">Variação % mín.</label>
            <input
              type="number"
              value={filters.variacaoMin || ""}
              onChange={(e) => set("variacaoMin", e.target.value)}
              className="w-full rounded-lg border border-surface-muted bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-500">Variação % máx.</label>
            <input
              type="number"
              value={filters.variacaoMax || ""}
              onChange={(e) => set("variacaoMax", e.target.value)}
              className="w-full rounded-lg border border-surface-muted bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-500">Impacto $ mín.</label>
            <input
              type="number"
              value={filters.impactoMin || ""}
              onChange={(e) => set("impactoMin", e.target.value)}
              className="w-full rounded-lg border border-surface-muted bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-navy-500">Impacto $ máx.</label>
            <input
              type="number"
              value={filters.impactoMax || ""}
              onChange={(e) => set("impactoMax", e.target.value)}
              className="w-full rounded-lg border border-surface-muted bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </div>
        </div>
      )}
    </div>
  );
}
