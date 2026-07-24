import { useEffect, useState } from "react";
import { X, Plus, History, Clock, FileSearch } from "lucide-react";
import type { CostVariation, JustificationType } from "../types";
import { CLASSIFICACAO_LABEL } from "../types";
import {
  createJustificationType,
  getHistoricoMaterial,
  listJustificationTypes,
  saveJustification,
} from "../services/api";
import { formatCurrencyPrecise, formatDate, formatNumber, formatPercent, formatPeriodo } from "../utils/format";

interface Props {
  variation: CostVariation | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function JustificationDrawer({ variation, onClose, onSaved }: Props) {
  const [types, setTypes] = useState<JustificationType[]>([]);
  const [typeId, setTypeId] = useState<string>("");
  const [texto, setTexto] = useState("");
  const [autor, setAutor] = useState("");
  const [saving, setSaving] = useState(false);
  const [newTypeMode, setNewTypeMode] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [historico, setHistorico] = useState<any[]>([]);
  const [tab, setTab] = useState<"editar" | "dados" | "historico">("editar");

  useEffect(() => {
    if (!variation) return;
    listJustificationTypes().then(setTypes);
    setTypeId(variation.justification?.justificationTypeId || "");
    setTexto(variation.justification?.textoLivre || "");
    setAutor(variation.justification?.autor || "");
    setTab("editar");
    getHistoricoMaterial(variation.id).then(setHistorico);
  }, [variation]);

  if (!variation) return null;

  async function handleCreateType() {
    if (!newTypeName.trim()) return;
    const created = await createJustificationType(newTypeName.trim());
    setTypes((prev) => [...prev, created]);
    setTypeId(created.id);
    setNewTypeName("");
    setNewTypeMode(false);
  }

async function handleSave() {
  if (!variation) return;

  setSaving(true);

  try {
    await saveJustification(variation.id, {
      justificationTypeId: typeId || null,
      textoLivre: texto || null,
      autor: autor || null,
    });

    onSaved();
    onClose();
  } finally {
    setSaving(false);
  }
}

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-navy-950/40 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-cardHover">
        <div className="flex items-start justify-between border-b border-surface-muted px-6 py-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-navy-500">
              {variation.material} · {formatPeriodo(variation.mes, variation.anoDM)}
            </p>
            <h2 className="mt-1 text-sm font-semibold text-navy-900">{variation.descricaoMaterial}</h2>
            <p className="mt-1 text-xs text-navy-500">{variation.fornecedor}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-navy-600 hover:bg-surface-muted">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 border-b border-surface-muted px-6 py-4 text-center">
          <div>
            <p className="text-[11px] text-navy-500">Variação MM %</p>
            <p className="text-sm font-semibold tabular-nums text-navy-900">
              {formatPercent(variation.variacaoMMPercentual)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-navy-500">Impacto</p>
            <p className="text-sm font-semibold tabular-nums text-navy-900">
              {formatCurrencyPrecise(variation.impactoMM)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-navy-500">Classificação</p>
            <p className="text-sm font-semibold text-navy-900">{CLASSIFICACAO_LABEL[variation.classificacao]}</p>
          </div>
        </div>

<div className="flex border-b border-surface-muted px-6">
          <button
            onClick={() => setTab("editar")}
            className={`border-b-2 px-3 py-3 text-sm font-medium ${
              tab === "editar" ? "border-brand-600 text-brand-700" : "border-transparent text-navy-500"
            }`}
          >
            Justificativa
          </button>
          <button
            onClick={() => setTab("dados")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium ${
              tab === "dados" ? "border-brand-600 text-brand-700" : "border-transparent text-navy-500"
            }`}
          >
            <FileSearch size={14} />
            Dados da entrada
          </button>
          <button
            onClick={() => setTab("historico")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-sm font-medium ${
              tab === "historico" ? "border-brand-600 text-brand-700" : "border-transparent text-navy-500"
            }`}
          >
            <History size={14} />
            Histórico do material
            {historico.length > 0 && (
              <span className="rounded-full bg-brand-100 px-1.5 text-[11px] text-brand-700">{historico.length}</span>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "editar" && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-navy-600">Tipo de justificativa</label>
                {!newTypeMode ? (
                  <div className="flex gap-2">
                    <select
                      value={typeId}
                      onChange={(e) => setTypeId(e.target.value)}
                      className="w-full rounded-lg border border-surface-muted bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
                    >
                      <option value="">Selecione...</option>
                      {types.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nome}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setNewTypeMode(true)}
                      title="Cadastrar novo tipo de justificativa"
                      className="flex shrink-0 items-center justify-center rounded-lg border border-surface-muted px-3 text-navy-600 hover:bg-surface"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      placeholder="Nome do novo tipo de justificativa"
                      className="w-full rounded-lg border border-brand-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
                      onKeyDown={(e) => e.key === "Enter" && handleCreateType()}
                    />
                    <button
                      onClick={handleCreateType}
                      className="shrink-0 rounded-lg bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-800"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setNewTypeMode(false)}
                      className="shrink-0 rounded-lg border border-surface-muted px-3 py-2 text-sm text-navy-600 hover:bg-surface"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-navy-600">Justificativa (texto livre)</label>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={5}
                  placeholder="Detalhe o motivo da variação..."
                  className="w-full resize-none rounded-lg border border-surface-muted bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-navy-600">Responsável (opcional)</label>
                <input
                  value={autor}
                  onChange={(e) => setAutor(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full rounded-lg border border-surface-muted bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
                />
              </div>
            </div>
          )}

     {tab === "dados" && (
            <div className="space-y-5">
              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-500">Identificação</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <Campo label="Material" valor={variation.material} />
                  <Campo label="Tipo de Material (TMat)" valor={variation.tipoMaterial || "—"} />
                  <Campo label="Centro" valor={variation.centro} />
                  <Campo label="Categoria Contábil" valor={variation.categoriaContabil || "—"} />
                  <Campo label="Pedido (Doc. compra)" valor={variation.docCompra || "—"} />
                  <Campo label="Item" valor={variation.item || "—"} />
                  <Campo label="Referência" valor={variation.referencia || "—"} />
                  <Campo label="Doc. ref." valor={variation.docRef || "—"} />
                  <Campo label="Data de Lançamento" valor={formatDate(variation.dataLancamento)} />
                  <Campo label="Período" valor={formatPeriodo(variation.mes, variation.anoDM)} />
                </div>
              </section>

              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-500">Fornecedor</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <Campo label="Fornecedor" valor={variation.fornecedor} />
                  <Campo label="Conta do Fornecedor" valor={variation.contaFornecedor || "—"} />
                  <Campo label="Chave do País" valor={variation.chaveDoPais || "—"} />
                  <Campo label="Taxa de Câmbio" valor={variation.taxaCambio != null ? formatNumber(variation.taxaCambio) : "—"} />
                </div>
              </section>

              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-500">Quantidade e Valores</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <Campo label="Quantidade de Entrada" valor={formatNumber(variation.qtdEntrada)} />
                  <Campo label="Unidade de Medida" valor={variation.unidadeMedida || "—"} />
                  <Campo label="Necessário Conversão?" valor={variation.necessarioConv ? "Sim" : "Não"} />
                  <Campo label="Montante em MI" valor={formatCurrencyPrecise(variation.montanteMI)} />
                  <Campo label="Preço de Entrada" valor={formatCurrencyPrecise(variation.unitEntrada)} />
                  <Campo label="Médio Móvel" valor={formatCurrencyPrecise(variation.medioMovel)} />
                </div>
              </section>

              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-500">
                  Análise vs. Médio Móvel (SAP)
                </p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <Campo label="Diferença (R$)" valor={formatCurrencyPrecise(variation.variacaoMMValor)} />
                  <Campo label="Diferença (%)" valor={formatPercent(variation.variacaoMMPercentual)} />
                  <Campo label="Impacto Financeiro" valor={formatCurrencyPrecise(variation.impactoMM)} />
                  <Campo label="Magnitude" valor={variation.magnitude != null ? formatPercent(variation.magnitude) : "—"} />
                </div>
              </section>

              <section>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-500">
                  Análise Histórica (entradas anteriores deste material)
                </p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <Campo
                    label="Qtd. de Entradas Anteriores"
                    valor={formatNumber(variation.qtdEntradasAnteriores)}
                  />
                  <Campo
                    label="Média Histórica de Entrada"
                    valor={
                      variation.mediaHistoricaEntrada != null
                        ? formatCurrencyPrecise(variation.mediaHistoricaEntrada)
                        : "Primeira entrada registrada"
                    }
                  />
                  <Campo
                    label="Desvio Histórico (%)"
                    valor={
                      variation.desvioHistoricoPercentual != null
                        ? formatPercent(variation.desvioHistoricoPercentual)
                        : "—"
                    }
                  />
                </div>
              </section>

              {variation.obs && (
                <section>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-500">Observação (planilha)</p>
                  <p className="rounded-lg bg-surface px-3 py-2 text-sm text-navy-700">{variation.obs}</p>
                </section>
              )}
            </div>
          )}

          {tab === "historico" && (
            <div className="space-y-3">
              {historico.length === 0 && (
                <p className="py-8 text-center text-sm text-navy-500">
                  Nenhuma alteração de justificativa registrada ainda para este material.
                </p>
              )}
              {historico.map((h) => (
                <div key={h.id} className="rounded-lg border border-surface-muted p-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-navy-500">
                    <Clock size={12} />
                    {formatDate(h.alteradoEm)} {h.autor && `· ${h.autor}`}
                  </div>
                  {h.textoNovo && <p className="mt-1.5 text-sm text-navy-800">{h.textoNovo}</p>}
                  {!h.textoNovo && !h.tipoNovo && (
                    <p className="mt-1.5 text-sm italic text-navy-400">Justificativa removida</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {tab === "editar" && (
          <div className="border-t border-surface-muted px-6 py-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar justificativa"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-[11px] text-navy-500">{label}</p>
      <p className="font-medium text-navy-800">{valor}</p>
    </div>
  );
}
