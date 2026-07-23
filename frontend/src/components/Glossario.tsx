import { X, BookOpen } from "lucide-react";
import { useState } from "react";

const TERMOS = [
  {
    termo: "Classificação",
    explicacao:
      "Categoria atribuída a cada material com base na Diferença (%): Redução crítica, Aumento crítico, Redução relevante, Aumento relevante ou Crítico financeiro. Materiais sem variação relevante (classificados como 'OK' na planilha) nem entram no sistema.",
  },
  {
    termo: "Diferença (R$) e Diferença (%)",
    explicacao:
      "A diferença entre o Preço de Entrada e o Médio Móvel daquela linha: Preço de Entrada − Médio Móvel. O percentual é essa mesma diferença dividida pelo Médio Móvel. Mostra se aquela entrada custou mais ou menos que a referência do SAP, e em que proporção.",
  },
  {
    termo: "Impacto Financeiro (R$)",
    explicacao:
      "A Diferença (R$) multiplicada pela quantidade de entrada. É o que realmente importa financeiramente: uma diferença de preço grande em pouca quantidade pode valer menos do que uma diferença pequena em grande quantidade.",
  },
  {
    termo: "Médio Móvel",
    explicacao:
      "O preço de referência calculado pelo SAP para aquele material naquele período. É um valor fixo por material/mês, usado como base de comparação — não muda entrada a entrada.",
  },
  {
    termo: "Preço de Entrada",
    explicacao:
      "O preço unitário daquela entrada/compra específica. Cada linha da tabela representa uma entrada diferente, então o mesmo material pode aparecer várias vezes com preços de entrada diferentes.",
  },
  {
    termo: "Reincidência",
    explicacao:
      "Quantidade de entradas (linhas) com variação relevante que aquele material teve ao todo, somando todos os períodos importados — não é a quantidade de meses distintos. Se o mesmo material tiver 3 entradas diferentes no mesmo mês, isso já conta como reincidência 3.",
  },
];

export default function Glossario() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-surface-muted bg-white px-3 py-2 text-sm font-medium text-navy-700 hover:bg-surface"
      >
        <BookOpen size={15} />
        Glossário
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 backdrop-blur-sm px-4">
          <div className="max-h-[80vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-cardHover">
            <div className="flex items-center justify-between border-b border-surface-muted px-6 py-4">
              <h2 className="text-base font-semibold text-navy-900">Glossário — o que significa cada dado</h2>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-navy-600 hover:bg-surface-muted">
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-5">
              {TERMOS.map((t) => (
                <div key={t.termo}>
                  <p className="text-sm font-semibold text-navy-900">{t.termo}</p>
                  <p className="mt-1 text-sm leading-relaxed text-navy-600">{t.explicacao}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
