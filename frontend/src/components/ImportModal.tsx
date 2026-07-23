import { useRef, useState } from "react";
import { UploadCloud, X, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { uploadExcel } from "../services/api";

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export default function ImportModal({ open, onClose, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  if (!open) return null;

  function reset() {
    setFile(null);
    setProgress(0);
    setStatus("idle");
    setResult(null);
    setErrorMsg("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleUpload() {
    if (!file) return;
    setStatus("uploading");
    try {
      const data = await uploadExcel(file, setProgress);
      setResult(data);
      setStatus("done");
      onImported();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || "Falha ao importar o arquivo.");
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-cardHover">
        <div className="flex items-center justify-between border-b border-surface-muted px-6 py-4">
          <h2 className="text-base font-semibold text-navy-900">Importar Monitor.xlsx</h2>
          <button onClick={handleClose} className="rounded-lg p-1.5 text-navy-600 hover:bg-surface-muted">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          {status === "idle" && (
            <>
              <p className="mb-4 text-sm text-navy-700">
                Selecione o arquivo <span className="font-mono text-xs bg-surface-muted px-1.5 py-0.5 rounded">Monitor.xlsx</span> atualizado.
                Apenas a aba <strong>Monitor</strong> é lida; materiais classificados como <strong>OK</strong> são
                ignorados automaticamente. Justificativas já cadastradas são preservadas.
              </p>
              <div
                onClick={() => inputRef.current?.click()}
                className="cursor-pointer rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 px-6 py-10 text-center transition hover:border-brand-400 hover:bg-brand-50"
              >
                <UploadCloud className="mx-auto mb-2 text-brand-500" size={30} />
                {file ? (
                  <p className="text-sm font-medium text-navy-800">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-navy-800">Clique para selecionar o arquivo</p>
                    <p className="text-xs text-navy-500 mt-1">.xlsx exportado da pasta da Controladoria</p>
                  </>
                )}
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={handleClose}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-navy-600 hover:bg-surface-muted"
                >
                  Cancelar
                </button>
                <button
                  disabled={!file}
                  onClick={handleUpload}
                  className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-40"
                >
                  Importar agora
                </button>
              </div>
            </>
          )}

          {status === "uploading" && (
            <div className="py-8 text-center">
              <Loader2 className="mx-auto mb-3 animate-spin text-brand-600" size={30} />
              <p className="text-sm font-medium text-navy-800">Importando dados…</p>
              <div className="mx-auto mt-4 h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-navy-500">{progress}%</p>
            </div>
          )}

          {status === "done" && result && (
            <div className="py-4 text-center">
              <CheckCircle2 className="mx-auto mb-3 text-success-500" size={34} />
              <p className="text-sm font-semibold text-navy-900">Importação concluída</p>
<div className="mt-4 grid grid-cols-3 gap-2 text-left">
                <div className="rounded-lg bg-surface-muted p-3">
                  <p className="text-xs text-navy-500">Linhas lidas</p>
                  <p className="text-lg font-semibold text-navy-900">{result.totalLinhasLidas}</p>
                </div>
                <div className="rounded-lg bg-brand-50 p-3">
                  <p className="text-xs text-brand-700">Com variação</p>
                  <p className="text-lg font-semibold text-brand-800">{result.totalComVariacao}</p>
                </div>
                <div className="rounded-lg bg-surface-muted p-3">
                  <p className="text-xs text-navy-500">Ignoradas (OK)</p>
                  <p className="text-lg font-semibold text-navy-900">{result.totalIgnoradasOK}</p>
                </div>
                <div className="rounded-lg bg-success-50 p-3">
                  <p className="text-xs text-success-700">Novos</p>
                  <p className="text-lg font-semibold text-success-800">{result.registrosNovos}</p>
                </div>
                <div className="rounded-lg bg-violet-400/10 p-3">
                  <p className="text-xs text-violet-600">Atualizados</p>
                  <p className="text-lg font-semibold text-violet-700">{result.registrosAtualizados}</p>
                </div>
                <div className="rounded-lg bg-surface-muted p-3">
                  <p className="text-xs text-navy-500">Total no banco</p>
                  <p className="text-lg font-semibold text-navy-900">{result.totalAtualNoBanco}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="mt-6 w-full rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
              >
                Concluir
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="py-4 text-center">
              <AlertTriangle className="mx-auto mb-3 text-danger-500" size={34} />
              <p className="text-sm font-semibold text-navy-900">Não foi possível importar</p>
              <p className="mt-1 text-sm text-navy-600">{errorMsg}</p>
              <div className="mt-5 flex justify-center gap-2">
                <button onClick={reset} className="rounded-lg px-4 py-2 text-sm font-medium text-navy-600 hover:bg-surface-muted">
                  Tentar novamente
                </button>
                <button onClick={handleClose} className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800">
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
