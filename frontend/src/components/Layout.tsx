import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Table2, BarChart3, ListChecks, UploadCloud, TrendingUp, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import ImportModal from "./ImportModal";
import { GlobalFiltersProvider } from "../context/GlobalFiltersContext";
import { resetAllData } from "../services/api";

const NAV_ITEMS = [
  { to: "/", label: "Visão Geral", icon: LayoutDashboard, end: true },
  { to: "/monitoramento", label: "Monitoramento", icon: Table2 },
  { to: "/dashboards", label: "Análise Gráfica", icon: BarChart3 },
  { to: "/justificativas", label: "Tipos de Justificativa", icon: ListChecks },
];

export default function Layout() {
  const [importOpen, setImportOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  function closeResetModal() {
    setResetOpen(false);
    setResetConfirmText("");
    setResetError("");
  }

  async function handleReset() {
    setResetLoading(true);
    setResetError("");
    try {
      await resetAllData();
      setRefreshKey((k) => k + 1);
      closeResetModal();
    } catch (err: any) {
      setResetError(err?.response?.data?.error || "Falha ao apagar os dados.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-full bg-surface">
      <aside className="flex w-64 shrink-0 flex-col bg-navy-900 text-white">
        <div className="flex items-center gap-2.5 px-6 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-500">
            <TrendingUp size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Monitor de Custos</p>
            <p className="text-[11px] text-brand-200/70">Controladoria</p>
          </div>
        </div>
        <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-brand-100/70 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <item.icon size={17} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 px-4 py-4">
          <button
            onClick={() => setImportOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-violet-500 px-3 py-2.5 text-sm font-medium text-white shadow-card transition hover:brightness-110"
          >
            <UploadCloud size={16} />
            Importar Excel
          </button>
          <p className="mt-2 text-center text-[11px] text-brand-200/50">
            Atualize os dados sempre que o Monitor.xlsx mudar
          </p>
          <button
            onClick={() => setResetOpen(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-danger-500/30 px-3 py-2 text-xs font-medium text-danger-400 transition hover:bg-danger-500/10"
          >
            <Trash2 size={14} />
            Apagar todos os dados
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <GlobalFiltersProvider>
          <Outlet context={{ refreshKey }} />
        </GlobalFiltersProvider>
      </main>
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => setRefreshKey((k) => k + 1)}
      />

      {resetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-cardHover">
            <div className="px-6 py-5">
              <AlertTriangle className="mx-auto mb-3 text-danger-500" size={34} />
              <p className="text-center text-sm font-semibold text-navy-900">
                Apagar todos os dados importados?
              </p>
              <p className="mt-2 text-center text-sm text-navy-600">
                Isso apaga permanentemente todas as variações, justificativas e o histórico de
                importações. Os <strong>tipos de justificativa</strong> cadastrados serão mantidos.
                Essa ação não pode ser desfeita.
              </p>
              <p className="mt-4 text-xs font-medium text-navy-500">
                Digite <span className="font-mono font-bold text-danger-600">EXCLUIR</span> para confirmar:
              </p>
              <input
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-surface-muted bg-surface px-3 py-2 text-sm outline-none focus:border-danger-400"
                placeholder="EXCLUIR"
              />
              {resetError && <p className="mt-2 text-xs text-danger-600">{resetError}</p>}
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={closeResetModal}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-navy-600 hover:bg-surface-muted"
                >
                  Cancelar
                </button>
                <button
                  disabled={resetConfirmText !== "EXCLUIR" || resetLoading}
                  onClick={handleReset}
                  className="flex items-center gap-2 rounded-lg bg-danger-600 px-4 py-2 text-sm font-medium text-white hover:bg-danger-700 disabled:opacity-40"
                >
                  {resetLoading && <Loader2 size={14} className="animate-spin" />}
                  Apagar tudo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
