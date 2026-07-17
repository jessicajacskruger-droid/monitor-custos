import { useState } from "react";
import { Download, FileSpreadsheet, FileText, FileType2 } from "lucide-react";
import type { VariationFilters } from "../types";
import { buildExportUrl } from "../services/api";

export default function ExportMenu({ filters }: { filters: VariationFilters }) {
  const [open, setOpen] = useState(false);

  const options = [
    { key: "excel", label: "Excel (.xlsx)", icon: FileSpreadsheet },
    { key: "csv", label: "CSV", icon: FileText },
    { key: "pdf", label: "PDF (auditoria)", icon: FileType2 },
  ] as const;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-surface-muted bg-white px-3 py-2 text-sm font-medium text-navy-700 hover:bg-surface"
      >
        <Download size={15} />
        Exportar
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl bg-white p-1.5 shadow-cardHover">
            {options.map((o) => (
              <a
                key={o.key}
                href={buildExportUrl(o.key, filters)}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-navy-700 hover:bg-surface"
              >
                <o.icon size={15} />
                {o.label}
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
