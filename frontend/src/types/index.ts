export type Classificacao =
  | "REDUCAO_CRITICA"
  | "AUMENTO_CRITICO"
  | "REDUCAO_RELEVANTE"
  | "AUMENTO_RELEVANTE"
  | "CRITICO_FINANCEIRO";

export const CLASSIFICACAO_LABEL: Record<Classificacao, string> = {
  REDUCAO_CRITICA: "Redução crítica",
  AUMENTO_CRITICO: "Aumento crítico",
  REDUCAO_RELEVANTE: "Redução relevante",
  AUMENTO_RELEVANTE: "Aumento relevante",
  CRITICO_FINANCEIRO: "Crítico financeiro",
};

export const CLASSIFICACAO_COLOR: Record<Classificacao, string> = {
  REDUCAO_CRITICA: "bg-brand-100 text-brand-700",
  AUMENTO_CRITICO: "bg-danger-50 text-danger-600",
  REDUCAO_RELEVANTE: "bg-brand-50 text-brand-600",
  AUMENTO_RELEVANTE: "bg-violet-400/10 text-violet-600",
  CRITICO_FINANCEIRO: "bg-danger-500/10 text-danger-600",
};

export interface JustificationType {
  id: string;
  nome: string;
  ativo: boolean;
  ordem: number;
}

export interface Justification {
  id: string;
  costVariationId: string;
  justificationTypeId: string | null;
  justificationType: JustificationType | null;
  textoLivre: string | null;
  autor: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CostVariation {
  id: string;
  material: string;
  descricaoMaterial: string;
  tipoMaterial: string | null;
  anoDM: number;
  mes: number;
  dataLancamento: string;
  centro: string;
  categoriaContabil: string | null;
  docCompra: string | null;
  item: string | null;
  referencia: string | null;
  docRef: string | null;
  fornecedor: string;
  contaFornecedor: string | null;
  chaveDoPais: string | null;
  taxaCambio: number | null;
  qtdEntrada: number;
  unidadeMedida: string | null;
  necessarioConv: boolean;
  montanteMI: number;
  unitEntrada: number;
  medioMovel: number;
  variacaoMMValor: number;
  variacaoMMPercentual: number;
  impactoMM: number;
  impactoMMAbs: number;
  variacaoMMPercentualAbs: number;
  classificacao: Classificacao;
  magnitude: number | null;
  mediaDinamica: string | null;
  desvioEntradasReal: number | null;
  mediaHistoricaEntrada: number | null;
  desvioHistoricoPercentual: number | null;
  qtdEntradasAnteriores: number;
  obs: string | null;
  justification: Justification | null;
  reincidencia?: number;
}

export interface PaginatedResponse<T> {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  data: T[];
}

export interface KpiData {
  totalMateriaisComVariacao: number;
  impactoFinanceiroTotal: number;
  impactoFinanceiroAbsolutoTotal: number;
  variacaoMedia: number;
  materiaisSemJustificativa: number;
  materiaisComJustificativa: number;
  percentualJustificado: number;
  maiorAumento: { material: string; descricaoMaterial: string; variacaoMMPercentual: number; impactoMM: number } | null;
  maiorReducao: { material: string; descricaoMaterial: string; variacaoMMPercentual: number; impactoMM: number } | null;
}

export interface VariationFilters {
  mes?: string;
  ano?: string;
  tipoMaterial?: string;
  centro?: string;
  categoriaContabil?: string;
  material?: string;
  descricao?: string;
  fornecedor?: string;
  contaFornecedor?: string;
  variacaoMin?: string;
  variacaoMax?: string;
  impactoMin?: string;
  impactoMax?: string;
  justificativa?: "todos" | "com" | "sem";
  busca?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "impacto" | "variacao" | "data";
  sortDir?: "asc" | "desc";
}

export interface ImportLog {
  id: string;
  arquivoOrigem: string;
  dataImportacao: string;
  totalLinhasLidas: number;
  totalComVariacao: number;
  totalIgnoradasOK: number;
  status: "SUCESSO" | "SUCESSO_COM_AVISOS" | "ERRO";
  mensagem: string | null;
  duracaoMs: number | null;
}

export interface FiltrosOpcoes {
  tiposMaterial: string[];
  centros: string[];
  categoriasContabeis: string[];
}
