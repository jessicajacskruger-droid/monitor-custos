import { AlertTriangle, ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Repeat2 } from "lucide-react";
import type { CostVariation, VariationFilters } from "../types";
import { CLASSIFICACAO_COLOR, CLASSIFICACAO_LABEL } from "../types";
import { formatCurrencyPrecise, formatPercent, formatPeriodo } from "../utils/format";

interface Props {
  data: CostVariation[];
  total: number;
  page: number;
  totalPages: number;
  filters: VariationFilters;
  onChangeFilters: (f: VariationFilters) => void;
  onSelect: (v: CostVariation) => void;
  loading?: boolean;
}

export default function VariationsTable({
  data,
  total,
  page,
  totalPages,
  filters,
  onChangeFilters,
  onSelect,
  loading,
}: Props) {
  function toggleSort(field: "impacto" | "variacao") {
    if (filters.sortBy === field) {
      onChangeFilters({ ...filters, sortDir: filters.sortDir === "desc" ? "asc" : "desc" });
    } else {
      onChangeFilters({ ...filters, sortBy: field, sortDir: "desc" });
    }
  }

  function SortIcon({ field }: { field: "impacto" | "variacao" }) {
    if (filters.sortBy !== field) return null;
    return filters.sortDir === "desc" ? <ArrowDown size={12} /> : <ArrowUp size={12} />;
  }

  return (
    <div className="rounded-2xl bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-surface-muted px-5 py-3">
        <p className="text-sm text-navy-500">
          <span className="font-semibold text-navy-800">{total}</span> materiais com variação relevante
        </p>
        <div className="flex gap-1 rounded-lg bg-surface p-1">
          <button
            onClick={() => toggleSort("impacto")}
            className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              filters.sortBy !== "variacao"
                ? "bg-white text-brand-700 shadow-sm"
                : "text-navy-500 hover:text-navy-700"
            }`}
          >
            Maior impacto financeiro <SortIcon field="impacto" />
          </button>
          <button
            onClick={() => toggleSort("variacao")}
            className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              filters.sortBy === "variacao"
                ? "bg-white text-brand-700 shadow-sm"
                : "text-navy-500 hover:text-navy-700"
            }`}
          >
            Maior variação % <SortIcon field="variacao" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-muted text-left text-xs uppercase tracking-wide text-navy-500">
              <th className="w-10 px-4 py-3"></th>
              <th className="px-3 py-3">Material</th>
              <th className="px-3 py-3">Fornecedor</th>
              <th className="px-3 py-3">Período</th>
              <th className="px-3 py-3 text-right">Unit. Entrada</th>
              <th className="px-3 py-3 text-right">Médio Móvel</th>
              <th className="px-3 py-3 text-right">Variação %</th>
              <th className="px-3 py-3 text-right">Impacto $</th>
              <th className="px-3 py-3">Classificação</th>
              <th className="px-3 py-3">Justificativa</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-surface-muted/60">
                  <td colSpan={10} className="px-4 py-3">
                    <div className="h-4 w-full animate-pulse rounded bg-surface-muted" />
                  </td>
                </tr>
              ))}

            {!loading &&
              data.map((row) => {
                const semJustificativa = !row.justification;
                return (
                  <tr
                    key={row.id}
                    onClick={() => onSelect(row)}
                    className={`cursor-pointer border-b border-surface-muted/60 transition hover:bg-brand-50/40 ${
                      semJustificativa ? "bg-danger-50/40" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      {semJustificativa && <AlertTriangle size={15} className="text-danger-500" />}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-navy-900">{row.material}</p>
                      <p className="max-w-[220px] truncate text-xs text-navy-500">{row.descricaoMaterial}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="max-w-[160px] truncate text-navy-700">{row.fornecedor}</p>
                    </td>
                    <td className="px-3 py-3 text-navy-600">{formatPeriodo(row.mes, row.anoDM)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-navy-700">
                      {formatCurrencyPrecise(row.unitEntrada)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-navy-700">
                      {formatCurrencyPrecise(row.medioMovel)}
                    </td>
                    <td
                      className={`px-3 py-3 text-right tabular-nums font-semibold ${
                        row.variacaoMMPercentual >= 0 ? "text-danger-600" : "text-brand-700"
                      }`}
                    >
                      {formatPercent(row.variacaoMMPercentual)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold text-navy-900">
                      {formatCurrencyPrecise(row.impactoMM)}
                      {(row.reincidencia || 1) > 1 && (
                        <span
                          title={`Reincidente: ${row.reincidencia} ocorrências`}
                          className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-violet-400/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-600"
                        >
                          <Repeat2 size={10} />
                          {row.reincidencia}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-[11px] font-medium ${
                          CLASSIFICACAO_COLOR[row.classificacao]
                        }`}
                      >
                        {CLASSIFICACAO_LABEL[row.classificacao]}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {row.justification ? (
                        <p className="max-w-[180px] truncate text-navy-700">
                          {row.justification.justificationType?.nome || row.justification.textoLivre || "—"}
                        </p>
                      ) : (
                        <span className="text-xs font-medium text-danger-600">Pendente</span>
                      )}
                    </td>
                  </tr>
                );
              })}

            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-sm text-navy-500">
                  Nenhum material com variação encontrado para os filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-surface-muted px-5 py-3">
        <p className="text-xs text-navy-500">
          Página {page} de {totalPages || 1}
        </p>
        <div className="flex gap-1">
          <button
            disabled={page <= 1}
            onClick={() => onChangeFilters({ ...filters, page: page - 1 })}
            className="flex items-center justify-center rounded-lg border border-surface-muted p-1.5 text-navy-600 hover:bg-surface disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => onChangeFilters({ ...filters, page: page + 1 })}
            className="flex items-center justify-center rounded-lg border border-surface-muted p-1.5 text-navy-600 hover:bg-surface disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
