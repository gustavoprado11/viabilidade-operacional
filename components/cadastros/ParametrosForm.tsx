'use client';

import { useActionState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { initialActionState, type ActionState } from '@/lib/actions/types';
import type { ParametrosForno } from '@/lib/queries/parametros';

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initial: ParametrosForno;
};

const groups: Array<{ title: string; fields: Array<{ name: keyof ParametrosForno; label: string; step?: string }> }> = [
  {
    title: 'Operação',
    fields: [
      { name: 'corridas_por_dia', label: 'Corridas por dia' },
      { name: 'duracao_corrida_min', label: 'Duração corrida (min)' },
      { name: 'consumo_minerio_dia', label: 'Consumo minério/dia (ton)', step: '0.01' },
    ],
  },
  {
    title: 'Basicidade e escória',
    fields: [
      { name: 'b2_min', label: 'B2 mínimo', step: '0.001' },
      { name: 'b2_max', label: 'B2 máximo', step: '0.001' },
      { name: 'b2_alvo', label: 'B2 alvo', step: '0.001' },
      { name: 'al2o3_escoria_alvo_min', label: 'Al₂O₃ escória alvo mín (%)', step: '0.01' },
      { name: 'al2o3_escoria_alvo_max', label: 'Al₂O₃ escória alvo máx (%)', step: '0.01' },
      { name: 'al2o3_escoria_limite', label: 'Al₂O₃ escória limite (%)', step: '0.01' },
      { name: 'mgo_al2o3_min', label: 'MgO/Al₂O₃ mínimo', step: '0.001' },
    ],
  },
  {
    title: 'Rendimento',
    fields: [
      { name: 'rend_fe_ref1', label: 'Fe ref 1 (%)', step: '0.01' },
      { name: 'rend_ref1', label: 'Rendimento ref 1', step: '0.0001' },
      { name: 'rend_fe_ref2', label: 'Fe ref 2 (%)', step: '0.01' },
      { name: 'rend_ref2', label: 'Rendimento ref 2', step: '0.0001' },
      { name: 'fator_estavel', label: 'Fator estável', step: '0.001' },
      { name: 'fator_atencao', label: 'Fator atenção', step: '0.001' },
      { name: 'fator_instavel', label: 'Fator instável', step: '0.001' },
    ],
  },
  {
    title: 'Partição de contaminantes',
    fields: [
      { name: 'particao_p_gusa', label: 'Partição P gusa', step: '0.001' },
      { name: 'particao_mn_gusa', label: 'Partição Mn gusa', step: '0.001' },
      { name: 'si_intercept', label: 'Si intercept', step: '0.001' },
      { name: 'si_coef_b2', label: 'Si coef B2', step: '0.001' },
      { name: 's_gusa_fixo', label: 'S gusa fixo (%)', step: '0.001' },
      { name: 'c_gusa_fixo', label: 'C gusa fixo (%)', step: '0.001' },
    ],
  },
  {
    title: 'Custos e tributos',
    fields: [
      { name: 'custo_fixo_dia', label: 'Custo fixo/dia (R$)', step: '0.01' },
      { name: 'frete_gusa_ton', label: 'Frete gusa (R$/ton)', step: '0.01' },
      { name: 'deb_pis_ton', label: 'Débito PIS (R$/ton)', step: '0.01' },
      { name: 'deb_icms_ton', label: 'Débito ICMS (R$/ton)', step: '0.01' },
      { name: 'deb_ipi_ton', label: 'Débito IPI (R$/ton)', step: '0.01' },
    ],
  },
];

export function ParametrosForm({ action, initial }: Props) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="space-y-6">
      {state.status === 'success' && state.message ? (
        <Alert variant="success">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      {state.status === 'error' && state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      {groups.map((group) => (
        <section key={group.title} className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">{group.title}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {group.fields.map(({ name, label, step }) => (
              <div key={name} className="space-y-2">
                <Label htmlFor={name}>{label}</Label>
                <Input
                  id={name}
                  name={name}
                  type="number"
                  step={step ?? '1'}
                  defaultValue={String(initial[name] ?? '')}
                  aria-invalid={state.fieldErrors?.[name] ? true : undefined}
                  required
                />
                {state.fieldErrors?.[name] ? (
                  <p className="text-xs text-destructive">{state.fieldErrors[name]}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ))}

      <Button type="submit" disabled={pending}>
        {pending ? 'Salvando…' : 'Salvar (cria nova versão)'}
      </Button>
    </form>
  );
}
