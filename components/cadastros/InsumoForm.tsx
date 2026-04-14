'use client';

import { useActionState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { initialActionState, type ActionState } from '@/lib/actions/types';
import type { Insumo } from '@/lib/queries/insumos';

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initial?: Insumo | null;
  submitLabel: string;
  onCancelHref: string;
};

const TIPOS = [
  { v: 'calcario', l: 'Calcário' },
  { v: 'bauxita', l: 'Bauxita' },
  { v: 'dolomita', l: 'Dolomita' },
  { v: 'coque', l: 'Coque' },
  { v: 'carvao', l: 'Carvão vegetal' },
  { v: 'outro', l: 'Outro' },
];

export function InsumoForm({ action, initial, submitLabel, onCancelHref }: Props) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  const num = (name: keyof Insumo, label: string, step = '0.01') => (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type="number"
        step={step}
        defaultValue={initial?.[name] == null ? '' : String(initial[name])}
        aria-invalid={state.fieldErrors?.[name] ? true : undefined}
      />
      {state.fieldErrors?.[name] ? (
        <p className="text-xs text-destructive">{state.fieldErrors[name]}</p>
      ) : null}
    </div>
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.status === 'error' && state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" name="nome" defaultValue={initial?.nome ?? ''} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo</Label>
          <select
            id="tipo"
            name="tipo"
            defaultValue={initial?.tipo ?? 'calcario'}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {TIPOS.map((t) => (
              <option key={t.v} value={t.v}>
                {t.l}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="unidade">Unidade</Label>
          <select
            id="unidade"
            name="unidade"
            defaultValue={initial?.unidade ?? 'ton'}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="ton">ton</option>
            <option value="MDC">MDC</option>
          </select>
        </div>
      </div>

      {num('preco_unit', 'Preço unitário (R$)')}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Composição química (%)</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {num('fe_pct', 'Fe', '0.01')}
          {num('sio2_pct', 'SiO₂', '0.01')}
          {num('al2o3_pct', 'Al₂O₃', '0.01')}
          {num('cao_pct', 'CaO', '0.01')}
          {num('mgo_pct', 'MgO', '0.01')}
          {num('c_fixo_pct', 'C fixo', '0.01')}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Específicos</h2>
        <div className="grid grid-cols-2 gap-4">
          {num('densidade_kg_m3', 'Densidade (kg/m³)', '0.01')}
          {num('pis_credito', 'PIS crédito (R$/unid)')}
          {num('icms_credito', 'ICMS crédito (R$/unid)')}
        </div>
      </section>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Salvando…' : submitLabel}
        </Button>
        <Button type="button" variant="outline" asChild>
          <a href={onCancelHref}>Cancelar</a>
        </Button>
      </div>
    </form>
  );
}
