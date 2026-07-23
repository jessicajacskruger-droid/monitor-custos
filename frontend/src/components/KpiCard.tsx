import { LucideIcon } from "lucide-react";
import clsx from "clsx";
import InfoTooltip from "./InfoTooltip";

interface Props {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "brand" | "violet" | "danger" | "success" | "navy";
  subtitle?: string;
  info?: string;
}
const TONES: Record<string, string> = {
  brand: "bg-brand-50 text-brand-700",
  violet: "bg-violet-400/10 text-violet-600",
  danger: "bg-danger-50 text-danger-600",
  success: "bg-success-50 text-success-500",
  navy: "bg-navy-900/5 text-navy-800",
};
export default function KpiCard({ label, value, icon: Icon, tone = "brand", subtitle, info }: Props) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card transition hover:shadow-cardHover">
      <div className="flex items-start justify-between">
        <div>
          <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-navy-500">
            {label}
            {info && <InfoTooltip text={info} />}
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-navy-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-navy-500">{subtitle}</p>}
        </div>
        <div className={clsx("flex h-10 w-10 items-center justify-center rounded-xl", TONES[tone])}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}
