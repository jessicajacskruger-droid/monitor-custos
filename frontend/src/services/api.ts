import axios from "axios";
import type {
  CostVariation,
  FiltrosOpcoes,
  ImportLog,
  Justification,
  JustificationType,
  KpiData,
  PaginatedResponse,
  VariationFilters,
} from "../types";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3333/api",
});

function cleanParams(filters: VariationFilters) {
  const out: Record<string, any> = {};
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  });
  return out;
}

// ---------- Variações ----------
export async function listVariations(filters: VariationFilters) {
  const { data } = await api.get<PaginatedResponse<CostVariation>>("/variations", {
    params: cleanParams(filters),
  });
  return data;
}

export async function getVariation(id: string) {
  const { data } = await api.get<CostVariation>(`/variations/${id}`);
  return data;
}

export async function getHistoricoMaterial(id: string) {
  const { data } = await api.get(`/variations/${id}/historico-material`);
  return data;
}

export async function saveJustification(
  id: string,
  payload: { justificationTypeId?: string | null; textoLivre?: string | null; autor?: string | null }
) {
  const { data } = await api.put<Justification>(`/variations/${id}/justification`, payload);
  return data;
}

// ---------- Tipos de justificativa ----------
export async function listJustificationTypes(somenteAtivos = true) {
  const { data } = await api.get<JustificationType[]>("/justification-types", {
    params: { somenteAtivos },
  });
  return data;
}

export async function createJustificationType(nome: string) {
  const { data } = await api.post<JustificationType>("/justification-types", { nome });
  return data;
}

export async function updateJustificationType(
  id: string,
  payload: Partial<Pick<JustificationType, "nome" | "ativo" | "ordem">>
) {
  const { data } = await api.patch<JustificationType>(`/justification-types/${id}`, payload);
  return data;
}

export async function deleteJustificationType(id: string) {
  const { data } = await api.delete(`/justification-types/${id}`);
  return data;
}

// ---------- Dashboard ----------
export async function getKpis(filters: VariationFilters) {
  const { data } = await api.get<KpiData>("/dashboard/kpis", { params: cleanParams(filters) });
  return data;
}

export async function getFiltrosOpcoes() {
  const { data } = await api.get<FiltrosOpcoes>("/dashboard/filtros-opcoes");
  return data;
}

export async function getRankingImpacto(filters: VariationFilters, limit = 10) {
  const { data } = await api.get("/dashboard/ranking-impacto", {
    params: { ...cleanParams(filters), limit },
  });
  return data;
}

export async function getRankingVariacao(filters: VariationFilters, limit = 10) {
  const { data } = await api.get("/dashboard/ranking-variacao", {
    params: { ...cleanParams(filters), limit },
  });
  return data;
}

export async function getFornecedores(filters: VariationFilters, limit = 10) {
  const { data } = await api.get("/dashboard/fornecedores", {
    params: { ...cleanParams(filters), limit },
  });
  return data;
}

export async function getReincidencia(filters: VariationFilters, limit = 10) {
  const { data } = await api.get("/dashboard/reincidencia", {
    params: { ...cleanParams(filters), limit },
  });
  return data;
}

export async function getEvolucaoMensal(filters: VariationFilters) {
  const { data } = await api.get("/dashboard/evolucao-mensal", { params: cleanParams(filters) });
  return data;
}

export async function getDistribuicao(filters: VariationFilters) {
  const { data } = await api.get("/dashboard/distribuicao", { params: cleanParams(filters) });
  return data;
}

export async function getPareto(filters: VariationFilters, limit = 20) {
  const { data } = await api.get("/dashboard/pareto", { params: { ...cleanParams(filters), limit } });
  return data;
}

// ---------- Importação ----------
export async function uploadExcel(file: File, onProgress?: (pct: number) => void) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/import", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) onProgress(Math.round((evt.loaded * 100) / evt.total));
    },
  timeout: 15 * 60 * 1000,
  });
  return data;
}

export async function getImportHistory() {
  const { data } = await api.get<ImportLog[]>("/import/history");
  return data;
}

export async function resetAllData() {
  const { data } = await api.delete("/import/reset");
  return data;
}

// ---------- Exportação ----------
export function buildExportUrl(format: "excel" | "csv" | "pdf", filters: VariationFilters) {
  const params = new URLSearchParams(cleanParams(filters) as any).toString();
  return `${api.defaults.baseURL}/export/${format}${params ? `?${params}` : ""}`;
}
