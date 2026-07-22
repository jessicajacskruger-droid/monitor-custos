import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Table2, BarChart3, ListChecks, UploadCloud, TrendingUp } from "lucide-react";
import ImportModal from "./ImportModal";
import { GlobalFiltersProvider } from "../context/GlobalFiltersContext";

const NAV_ITEMS = [
  { to: "/", label: "Visão Geral", icon: LayoutDashboard, end: true },
  { to: "/monitoramento", label: "Monitoramento", icon: Table2 },
  { to: "/dashboards", label: "Análise Gráfica", icon: BarChart3 },
  { to: "/justificativas", label: "Tipos de Justificativa", icon: ListChecks },
];

export default function Layout() {
  const [importOpen, setImportOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
    </div>
  );
}
