import { useEffect, useState } from "react";
import {
  AlertCircle, CheckCircle2, DollarSign, Package, TrendingDown, TrendingUp, Repeat2, Building2,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import PageHeader from "../components/PageHeader";
import KpiCard from "../components/KpiCard";
import InfoTooltip from "../components/InfoTooltip";
import GlobalFilterBar from "../components/GlobalFilterBar";
import { useGlobalFilters } from "../context/GlobalFiltersContext";
import {
  getEvolucaoMensal, getFornecedores, getKpis, getRankingImpacto, getReincidencia,
} from "../services/api";
import type { KpiData } from "../types";
import { formatCurrency, formatCurrencyPrecise, formatPercent } from "../utils/format";

export default function Dashboard() {
  const { globalFilters } = useGlobalFilters();
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [evolucao, setEvolucao] = useState<any[]>([]);
  const [rankingImpacto, setRankingImpacto] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [reincidencia, setReincidencia] = useState<any[]>([]);

  async function load() {
    const [k, e, r, f, rc] = await Promise.all([
      getKpis(globalFilters),
      getEvolucaoMensal(globalFilters),
      getRankingImpacto(globalFilters, 6),
      getFornecedores(globalFilters, 6),
      getReincidencia(globalFilters, 6),
    ]);
    setKpis(k);
    setEvolucao(e);
    setRankingImpacto(r);
    setFornecedores(f);
    setReincidencia(rc);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(globalFilters)]);
  
  return (
    <div>
      <PageHeader title="Visão Geral" subtitle="Visão geral dos materiais com variação de custo relevante" />

      <div className="space-y-6 p-8">
        <GlobalFilterBar />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
<KpiCard
            label="Materiais com variação"
            value={kpis ? String(kpis.totalMateriaisComVariacao) : "…"}
            icon={Package}
            tone="brand"
            info="Quantidade de materiais cuja classificação é diferente de 'OK', dentro dos filtros ativos. Ou seja, materiais com variação de custo."
          />
          <KpiCard
            label="Impacto financeiro total"
            value={kpis ? formatCurrency(kpis.impactoFinanceiroTotal) : "…"}
            icon={DollarSign}
            tone="violet"
            info="Soma do campo 'Impacto MM $' de todos os materiais filtrados. Aumentos e reduções se compensam (é o impacto líquido, com sinal)."
          />
          <KpiCard
            label="Variação média"
            value={kpis ? formatPercent(kpis.variacaoMedia) : "…"}
            icon={kpis && kpis.variacaoMedia >= 0 ? TrendingUp : TrendingDown}
            tone="navy"
            info="Média simples do campo 'Variação MM %' de todos os materiais filtrados."
          />
          <KpiCard
            label="% já justificado"
            value={kpis ? `${kpis.percentualJustificado.toFixed(0)}%` : "…"}
            icon={CheckCircle2}
            tone="success"
            subtitle={kpis ? `${kpis.materiaisComJustificativa} de ${kpis.totalMateriaisComVariacao}` : undefined}
            info="Percentual de materiais que já têm uma justificativa registrada (tipo ou texto livre) sobre o total de materiais com variação relevante."
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-card">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase text-navy-500">
              <AlertCircle size={13} className="text-danger-500" /> Sem justificativa
              <InfoTooltip text="Materiais com variação relevante que ainda não têm nenhuma justificativa cadastrada." />
            </p>
            <p className="text-2xl font-bold text-navy-900">{kpis?.materiaisSemJustificativa ?? "…"}</p>
            <p className="mt-1 text-xs text-navy-500">materiais aguardando análise da Controladoria</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-card">
<p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase text-navy-500">
              <TrendingUp size={13} className="text-danger-500" /> Maior aumento
              <InfoTooltip text="O material com a maior 'Variação MM %' positiva entre os filtrados (maior aumento percentual de preço)." />
            </p>
            {kpis?.maiorAumento ? (
              <>
                <p className="truncate text-sm font-semibold text-navy-900">{kpis.maiorAumento.descricaoMaterial}</p>
                <p className="text-xs text-navy-500">
                  {kpis.maiorAumento.material} · {formatPercent(kpis.maiorAumento.variacaoMMPercentual)} ·{" "}
                  {formatCurrencyPrecise(kpis.maiorAumento.impactoMM)}
                </p>
              </>
            ) : (
              <p className="text-sm text-navy-400">—</p>
            )}
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-card">
<p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase text-navy-500">
              <TrendingDown size={13} className="text-brand-600" /> Maior redução
              <InfoTooltip text="O material com a maior 'Variação MM %' negativa entre os filtrados (maior queda percentual de preço)." />
            </p>
            {kpis?.maiorReducao ? (
              <>
                <p className="truncate text-sm font-semibold text-navy-900">{kpis.maiorReducao.descricaoMaterial}</p>
                <p className="text-xs text-navy-500">
                  {kpis.maiorReducao.material} · {formatPercent(kpis.maiorReducao.variacaoMMPercentual)} ·{" "}
                  {formatCurrencyPrecise(kpis.maiorReducao.impactoMM)}
                </p>
              </>
            ) : (
              <p className="text-sm text-navy-400">—</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow-card">
<p className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-navy-800">
              Evolução mensal do impacto financeiro (absoluto)
              <InfoTooltip text="Soma do Impacto Financeiro em valor absoluto (sem compensar aumentos e reduções entre si), por mês/ano. É diferente do KPI 'Impacto financeiro total' acima, que é líquido (com sinal) — por isso os dois números não coincidem." />
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={evolucao}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F6" />
                <XAxis dataKey="periodo" tick={{ fontSize: 11 }} stroke="#8494AC" />
                <YAxis tick={{ fontSize: 11 }} stroke="#8494AC" tickFormatter={(v) => formatCurrency(v)} width={80} />
                <Tooltip formatter={(v: number) => formatCurrencyPrecise(v)} />
                <Line type="monotone" dataKey="impactoAbsolutoTotal" name="Impacto Absoluto" stroke="#1E4B8F" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-card">
            <p className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-navy-800">
              Top materiais por impacto financeiro
              <InfoTooltip text="Os 6 materiais com maior Impacto MM $ em valor absoluto (aumentos e reduções mais significativos), dentro dos filtros ativos." />
            </p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={rankingImpacto} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF1F6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#8494AC" tickFormatter={(v) => formatCurrency(v)} />
                <YAxis
                  type="category"
                  dataKey="material"
                  tick={{ fontSize: 11 }}
                  stroke="#8494AC"
                  width={70}
                />
                <Tooltip formatter={(v: number) => formatCurrencyPrecise(v)} />
                <Bar dataKey="impactoMM" fill="#6C4FD1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow-card">
<p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-navy-800">
              <Building2 size={15} className="text-brand-600" /> Fornecedores com maior impacto
              <InfoTooltip text="Fornecedores agrupados pela soma do Impacto MM $ absoluto de todos os seus materiais com variação relevante." />
            </p>
            <div className="space-y-2">
              {fornecedores.map((f, i) => (
                <div key={f.fornecedor} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[10px] font-semibold text-brand-700">
                      {i + 1}
                    </span>
                    <span className="max-w-[220px] truncate text-sm text-navy-800">{f.fornecedor}</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-navy-900">
                    {formatCurrency(f.impactoAbsolutoTotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-card">
<p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-navy-800">
              <Repeat2 size={15} className="text-violet-500" /> Materiais com maior reincidência
              <InfoTooltip text="Quantidade de entradas (linhas) com variação relevante que aquele material teve ao todo, somando todos os períodos importados. Um número alto indica um problema recorrente de preço." />
            </p>
            <div className="space-y-2">
              {reincidencia.map((r) => (
                <div key={r.material} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
                  <div>
                    <p className="text-sm text-navy-800">{r.material}</p>
                    <p className="max-w-[220px] truncate text-xs text-navy-500">{r.descricaoMaterial}</p>
                  </div>
                  <span className="rounded-full bg-violet-400/10 px-2 py-1 text-xs font-semibold text-violet-600">
                    {r.ocorrencias}x
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
