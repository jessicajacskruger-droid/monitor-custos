import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import FilterBar from "../components/FilterBar";
import VariationsTable from "../components/VariationsTable";
import ExportMenu from "../components/ExportMenu";
import JustificationDrawer from "../components/JustificationDrawer";
import { listVariations } from "../services/api";
import type { CostVariation, VariationFilters } from "../types";

export default function Monitoramento() {
  const [filters, setFilters] = useState<VariationFilters>({
    page: 1,
    pageSize: 50,
    sortBy: "impacto",
    sortDir: "desc",
    justificativa: "todos",
  });
  const [data, setData] = useState<CostVariation[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CostVariation | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await listVariations(filters);
      setData(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  return (
    <div>
      <PageHeader
        title="Monitoramento"
        subtitle="Materiais com variação relevante — classificação diferente de 'OK'"
        actions={<ExportMenu filters={filters} />}
      />

      <div className="space-y-4 p-8">
        <FilterBar filters={filters} onChange={setFilters} />
        <VariationsTable
          data={data}
          total={total}
          page={filters.page || 1}
          totalPages={totalPages}
          filters={filters}
          onChangeFilters={setFilters}
          onSelect={setSelected}
          loading={loading}
        />
      </div>

      <JustificationDrawer
        variation={selected}
        onClose={() => setSelected(null)}
        onSaved={load}
      />
    </div>
  );
}
