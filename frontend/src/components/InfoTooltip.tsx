import { useState } from "react";
import { Info } from "lucide-react";

export default function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="flex h-4 w-4 items-center justify-center rounded-full text-navy-400 hover:text-navy-600"
      >
        <Info size={14} />
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-30 mt-1.5 w-64 -translate-x-1/2 rounded-lg bg-navy-900 px-3 py-2 text-xs leading-relaxed text-white shadow-cardHover">
          {text}
        </div>
      )}
    </span>
  );
}
