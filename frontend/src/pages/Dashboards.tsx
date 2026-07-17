import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer,
  Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from "recharts";
import PageHeader from "../components/PageHeader";
import FilterBar from "../components/FilterBar";
import {
  getDistribuicao, getEvolucaoMensal, getFornecedores, getPareto, getRankingImpacto,
  getRankingVariacao, listVariations,
} from "../services/api";
import { CLASSIFICACAO_LABEL, type VariationFilters } from "../types";
import { formatCurrency, formatCurrencyPrecise, formatPercent } from "../utils/format";

const PALETTE = ["#1E4B8F", "#6C4FD1", "#4C82D0", "#8B72E8", "#173A70", "#B3CBEE"];

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <p className="mb-4 text-sm font-semibold text-navy-800">{title}</p>
      {children}
    </div>
  );
}

export default function Dashboards() {
  const [filters, setFilters] = useState<VariationFilters>({ justificativa: "todos" });
  const [evolucao, setEvolucao] = useState<any[]>([]);
  const [rankingMateriais, setRankingMateriais] = useState<any[]>([]);
  const [rankingFornecedores, setRankingFornecedores] = useState<any[]>([]);
  const [pareto, setPareto] = useState<any[]>([]);
  const [distribuicao, setDistribuicao] = useState<any[]>([]);
  const [top10Impacto, setTop10Impacto] = useState<any[]>([]);
  const [top10Variacao, setTop10Variacao] = useState<any[]>([]);
  const [dispersao, setDispersao] = useState<any[]>([]);

  async function load() {
    const [e, rm, rf, p, d, ti, tv, disp] = await Promise.all([
      getEvolucaoMensal(filters),
      getRankingImpacto(filters, 8),
      getFornecedores(filters, 8),
      getPareto(filters, 15),
      getDistribuicao(filters),
      getRankingImpacto(filters, 10),
      getRankingVariacao(filters, 10),
      listVariations({ ...filters, page: 1, pageSize: 150, sortBy: "impacto", sortDir: "desc" }),
    ]);
    setEvolucao(e);
    setRankingMateriais(rm);
    setRankingFornecedores(rf);
    setPareto(p);
    setDistribuicao(d.map((x: any) => ({ ...x, label: CLASSIFICACAO_LABEL[x.classificacao as keyof typeof CLASSIFICACAO_LABEL] })));
    setTop10Impacto(ti);
    setTop10Variacao(tv);
    setDispersao(disp.data.map((r: any) => ({ x: r.unitEntrada, y: r.medioMovel, material: r.material, z: r.impactoMMAbs })));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  return (
    <div>
      <PageHeader title="Dashboards" subtitle="Análise gráfica dos materiais com variação relevante" />

      <div className="space-y-4 p-8">
        <FilterBar filters={filters} onChange={setFilters} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Evolução mensal das variações (impacto absoluto)">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={evolucao}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F6" />
                <XAxis dataKey="periodo" tick={{ fontSize: 11 }} stroke="#8494AC" />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="#8494AC" tickFormatter={(v) => formatCurrency(v)} width={80} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="#8494AC" tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: number, name) => (name === "variacaoMedia" ? formatPercent(v) : formatCurrencyPrecise(v))} />
                <Bar yAxisId="left" dataKey="impactoAbsolutoTotal" fill="#1E4B8F" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="variacaoMedia" stroke="#6C4FD1" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Distribuição por classificação">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={distribuicao}
                  dataKey="quantidade"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {distribuicao.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v} materiais`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {distribuicao.map((d, i) => (
                <div key={d.label} className="flex items-center gap-1.5 text-xs text-navy-600">
                  <span className="h-2 w-2 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                  {d.label} ({d.quantidade})
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Ranking dos materiais (impacto financeiro)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={rankingMateriais} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#8494AC" tickFormatter={(v) => formatCurrency(v)} />
                <YAxis type="category" dataKey="material" tick={{ fontSize: 11 }} stroke="#8494AC" width={70} />
                <Tooltip formatter={(v: number) => formatCurrencyPrecise(v)} />
                <Bar dataKey="impactoMM" fill="#1E4B8F" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Ranking dos fornecedores (impacto financeiro)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={rankingFornecedores} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#8494AC" tickFormatter={(v) => formatCurrency(v)} />
                <YAxis type="category" dataKey="fornecedor" tick={{ fontSize: 10 }} stroke="#8494AC" width={110} />
                <Tooltip formatter={(v: number) => formatCurrencyPrecise(v)} />
                <Bar dataKey="impactoAbsolutoTotal" fill="#6C4FD1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Pareto dos maiores impactos (80/20)">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={pareto}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F6" />
                <XAxis dataKey="material" tick={{ fontSize: 10 }} stroke="#8494AC" />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="#8494AC" tickFormatter={(v) => formatCurrency(v)} width={80} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="#8494AC" tickFormatter={(v) => `${v.toFixed(0)}%`} domain={[0, 100]} />
                <Tooltip formatter={(v: number, name) => (name === "percentualAcumulado" ? `${v.toFixed(1)}%` : formatCurrencyPrecise(v))} />
                <Bar yAxisId="left" dataKey="impactoAbs" fill="#4C82D0" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="percentualAcumulado" stroke="#DC2626" strokeWidth={2} dot={{ r: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Comparação: Unit. Entrada x Médio Móvel">
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F6" />
                <XAxis type="number" dataKey="x" name="Unit. Entrada" tick={{ fontSize: 11 }} stroke="#8494AC" tickFormatter={(v) => formatCurrency(v)} />
                <YAxis type="number" dataKey="y" name="Médio Móvel" tick={{ fontSize: 11 }} stroke="#8494AC" tickFormatter={(v) => formatCurrency(v)} />
                <ZAxis type="number" dataKey="z" range={[30, 300]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(v: number, name: string) => (name === "x" || name === "y" ? formatCurrencyPrecise(v) : v)}
                />
                <Scatter data={dispersao} fill="#6C4FD1" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
            <p className="mt-1 text-center text-[11px] text-navy-400">
              O tamanho da bolha representa o impacto financeiro do material
            </p>
          </ChartCard>

          <ChartCard title="Top 10 maiores impactos financeiros">
            <div className="space-y-1.5">
              {top10Impacto.map((r, i) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 odd:bg-surface">
                  <span className="flex items-center gap-2 truncate text-sm text-navy-800">
                    <span className="text-xs text-navy-400">{i + 1}.</span> {r.material} — {r.descricaoMaterial}
                  </span>
                  <span className="shrink-0 pl-2 text-sm font-semibold tabular-nums text-navy-900">
                    {formatCurrencyPrecise(r.impactoMM)}
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Top 10 maiores variações percentuais">
            <div className="space-y-1.5">
              {top10Variacao.map((r, i) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 odd:bg-surface">
                  <span className="flex items-center gap-2 truncate text-sm text-navy-800">
                    <span className="text-xs text-navy-400">{i + 1}.</span> {r.material} — {r.descricaoMaterial}
                  </span>
                  <span
                    className={`shrink-0 pl-2 text-sm font-semibold tabular-nums ${
                      r.variacaoMMPercentual >= 0 ? "text-danger-600" : "text-brand-700"
                    }`}
                  >
                    {formatPercent(r.variacaoMMPercentual)}
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
