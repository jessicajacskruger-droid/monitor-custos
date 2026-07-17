import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, X, EyeOff, Eye } from "lucide-react";
import PageHeader from "../components/PageHeader";
import {
  createJustificationType, deleteJustificationType, listJustificationTypes, updateJustificationType,
} from "../services/api";
import type { JustificationType } from "../types";

export default function Justificativas() {
  const [tipos, setTipos] = useState<JustificationType[]>([]);
  const [novoNome, setNovoNome] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNome, setEditingNome] = useState("");
  const [mostrarInativos, setMostrarInativos] = useState(false);

  async function load() {
    const data = await listJustificationTypes(!mostrarInativos);
    setTipos(data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarInativos]);

  async function handleCreate() {
    if (!novoNome.trim()) return;
    await createJustificationType(novoNome.trim());
    setNovoNome("");
    load();
  }

  async function handleToggleAtivo(t: JustificationType) {
    await updateJustificationType(t.id, { ativo: !t.ativo });
    load();
  }

  async function handleSaveEdit(id: string) {
    if (!editingNome.trim()) return;
    await updateJustificationType(id, { nome: editingNome.trim() });
    setEditingId(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este tipo de justificativa? Se já estiver em uso, ele será apenas inativado.")) return;
    await deleteJustificationType(id);
    load();
  }

  return (
    <div>
      <PageHeader
        title="Tipos de Justificativa"
        subtitle="Cadastre, edite ou desative as opções disponíveis ao justificar uma variação"
      />

      <div className="mx-auto max-w-2xl space-y-4 p-8">
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <p className="mb-3 text-sm font-semibold text-navy-800">Novo tipo de justificativa</p>
          <div className="flex gap-2">
            <input
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Ex: Aumento de matéria-prima internacional"
              className="w-full rounded-lg border border-surface-muted bg-surface px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
            <button
              onClick={handleCreate}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
            >
              <Plus size={15} />
              Adicionar
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-surface-muted px-5 py-3">
            <p className="text-sm font-semibold text-navy-800">Tipos cadastrados</p>
            <button
              onClick={() => setMostrarInativos((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-navy-500 hover:text-navy-700"
            >
              {mostrarInativos ? <EyeOff size={13} /> : <Eye size={13} />}
              {mostrarInativos ? "Ocultar inativos" : "Mostrar inativos"}
            </button>
          </div>

          <div className="divide-y divide-surface-muted">
            {tipos.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3">
                {editingId === t.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      autoFocus
                      value={editingNome}
                      onChange={(e) => setEditingNome(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(t.id)}
                      className="w-full rounded-lg border border-brand-300 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
                    />
                    <button onClick={() => handleSaveEdit(t.id)} className="rounded-lg p-1.5 text-success-500 hover:bg-success-50">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="rounded-lg p-1.5 text-navy-500 hover:bg-surface-muted">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className={`text-sm ${t.ativo ? "text-navy-800" : "text-navy-400 line-through"}`}>
                      {t.nome}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingId(t.id);
                          setEditingNome(t.nome);
                        }}
                        className="rounded-lg p-1.5 text-navy-500 hover:bg-surface-muted"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleToggleAtivo(t)}
                        className="rounded-lg p-1.5 text-navy-500 hover:bg-surface-muted"
                        title={t.ativo ? "Inativar" : "Reativar"}
                      >
                        {t.ativo ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="rounded-lg p-1.5 text-danger-500 hover:bg-danger-50"
                        title="Excluir"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {tipos.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-navy-500">Nenhum tipo cadastrado.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
