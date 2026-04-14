'use client';

import { useActionState, useMemo, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { initialActionState, type ActionState } from '@/lib/actions/types';
import type {
  EstatisticasDesvio,
  RecomendacaoAjuste,
} from '@/lib/calculation/calibration';
import type { Database } from '@/lib/supabase/types';

type ParamRow = Database['public']['Tables']['parametros_forno']['Row'];

// Parâmetros do forno editáveis pelo form manual (subset relevante)
const CAMPOS_EDITAVEIS: Array<{
  key: keyof ParamRow;
  label: string;
  step?: string;
}> = [
  { key: 'particao_p_gusa', label: 'Partição P gusa', step: '0.001' },
  { key: 'particao_mn_gusa', label: 'Partição Mn gusa', step: '0.001' },
  { key: 's_gusa_fixo', label: 'S gusa fixo (%)', step: '0.001' },
  { key: 'c_gusa_fixo', label: 'C gusa fixo (%)', step: '0.001' },
  { key: 'fator_estavel', label: 'Fator estável', step: '0.001' },
  { key: 'fator_atencao', label: 'Fator atenção', step: '0.001' },
  { key: 'fator_instavel', label: 'Fator instável', step: '0.001' },
  { key: 'desvio_tolerancia_pct', label: 'Tolerância de desvio (%)', step: '0.001' },
  { key: 'desvio_atencao_pct', label: 'Atenção de desvio (%)', step: '0.001' },
];

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  parametrosAtuais: ParamRow;
  estatisticas: EstatisticasDesvio[];
  recomendacoes: RecomendacaoAjuste[];
  corridasAnalisadas: number;
  podeAplicar: boolean;
};

// Mapa do camelCase do motor para snake_case do DB
const PARAM_MAP: Record<string, keyof ParamRow> = {
  particaoPGusa: 'particao_p_gusa',
  particaoMnGusa: 'particao_mn_gusa',
  sGusaFixo: 's_gusa_fixo',
  cGusaFixo: 'c_gusa_fixo',
  fatorEstavel: 'fator_estavel',
  fatorAtencao: 'fator_atencao',
  fatorInstavel: 'fator_instavel',
};

export function CalibracaoForm({
  action,
  parametrosAtuais,
  estatisticas,
  recomendacoes,
  corridasAnalisadas,
  podeAplicar,
}: Props) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  // Pré-selecionadas: confiança alta
  const [aceitas, setAceitas] = useState<Record<number, boolean>>(() => {
    const m: Record<number, boolean> = {};
    recomendacoes.forEach((r, i) => {
      m[i] = r.confianca === 'alta';
    });
    return m;
  });

  const [manuais, setManuais] = useState<Record<string, string>>({});

  const valoresRecomendados = useMemo(() => {
    const out: Record<string, number> = {};
    recomendacoes.forEach((r, i) => {
      if (aceitas[i]) {
        const dbKey = PARAM_MAP[r.parametro as string];
        if (dbKey) out[dbKey] = r.valorSugerido;
      }
    });
    return out;
  }, [aceitas, recomendacoes]);

  const patchFinal = useMemo(() => {
    const out: Record<string, number> = { ...valoresRecomendados };
    for (const [k, v] of Object.entries(manuais)) {
      if (v.trim() === '') continue;
      const n = Number(v);
      if (Number.isFinite(n)) out[k] = n;
    }
    // Remove os que não mudam
    for (const k of Object.keys(out)) {
      const atual = Number((parametrosAtuais as unknown as Record<string, number>)[k]);
      if (Math.abs(out[k]! - atual) < 1e-6) delete out[k];
    }
    return out;
  }, [valoresRecomendados, manuais, parametrosAtuais]);

  const patchSize = Object.keys(patchFinal).length;

  return (
    <form action={formAction} className="space-y-4" data-testid="calibracao-form">
      {state.status === 'success' && state.message ? (
        <Alert variant="success">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      {state.status === 'error' && state.message ? (
        <Alert variant="destructive" data-testid="calibracao-error">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      {!podeAplicar ? (
        <Alert data-testid="sem-corridas-suficientes">
          <AlertDescription>
            Mínimo de 5 corridas com análise química para aplicar calibração.
            Você tem {corridasAnalisadas}. O form abaixo fica em modo leitura
            até acumular mais dados.
          </AlertDescription>
        </Alert>
      ) : null}

      {recomendacoes.length > 0 ? (
        <section className="rounded-md border p-4">
          <h2 className="mb-2 text-sm font-semibold">Recomendações</h2>
          <ul className="space-y-2">
            {recomendacoes.map((r, i) => (
              <li key={r.parametro} className="rounded border bg-muted/30 p-3">
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={aceitas[i] ?? false}
                    onChange={(e) =>
                      setAceitas({ ...aceitas, [i]: e.target.checked })
                    }
                    disabled={!podeAplicar}
                  />
                  <span className="flex-1">
                    <span className="font-medium">
                      {String(r.parametro)}: {r.valorAtual.toFixed(4)} →{' '}
                      {r.valorSugerido.toFixed(4)}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      [confiança {r.confianca}, {r.baseadoEmNCorridas} corridas]
                    </span>
                    <p className="text-xs text-muted-foreground">{r.justificativa}</p>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <Alert>
          <AlertDescription>
            Nenhuma recomendação automática no momento. Use o ajuste manual
            abaixo se quiser calibrar.
          </AlertDescription>
        </Alert>
      )}

      <section className="rounded-md border p-4">
        <h2 className="mb-2 text-sm font-semibold">Ajuste manual</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CAMPOS_EDITAVEIS.map((c) => {
            const atual = String((parametrosAtuais as unknown as Record<string, number>)[c.key] ?? '');
            return (
              <div key={c.key as string} className="space-y-1">
                <Label htmlFor={c.key as string} className="text-xs">
                  {c.label}
                </Label>
                <Input
                  id={c.key as string}
                  type="number"
                  step={c.step}
                  placeholder={atual}
                  value={manuais[c.key as string] ?? ''}
                  onChange={(e) =>
                    setManuais({ ...manuais, [c.key as string]: e.target.value })
                  }
                  disabled={!podeAplicar}
                />
                <p className="text-xs text-muted-foreground">atual: {atual}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-md border p-4">
        <h2 className="mb-2 text-sm font-semibold">Preview do patch ({patchSize} mudança{patchSize === 1 ? '' : 's'})</h2>
        {patchSize === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma alteração selecionada.
          </p>
        ) : (
          <ul className="space-y-1 text-sm" data-testid="patch-preview">
            {Object.entries(patchFinal).map(([k, v]) => {
              const atual = Number((parametrosAtuais as unknown as Record<string, number>)[k]);
              return (
                <li key={k} className="tabular-nums">
                  <code>{k}</code>: {atual} → <strong>{v}</strong> (Δ{' '}
                  {(v - atual).toFixed(4)})
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="space-y-2">
        <Label htmlFor="justificativa">Justificativa (mín. 20 caracteres)</Label>
        <Input
          id="justificativa"
          name="justificativa"
          placeholder="Ex.: desvio sistemático em P/gusa após mudança de fornecedor."
          required
          minLength={20}
        />
      </div>

      <input type="hidden" name="corridas_analisadas" value={corridasAnalisadas} />
      <input
        type="hidden"
        name="desvio_medio_antes"
        value={JSON.stringify(
          estatisticas.map((s) => ({
            campo: s.campo,
            n: s.n,
            mediaDesvioPct: s.mediaDesvioPct,
          })),
        )}
      />
      <input
        type="hidden"
        name="desvio_medio_depois"
        value={JSON.stringify(patchFinal)}
      />
      <input type="hidden" name="patch" value={JSON.stringify(patchFinal)} />

      <Button
        type="submit"
        disabled={pending || !podeAplicar || patchSize === 0}
        data-testid="aplicar-calibracao"
      >
        {pending ? 'Aplicando…' : 'Aplicar calibração'}
      </Button>
    </form>
  );
}
