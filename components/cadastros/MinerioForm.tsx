'use client';

import { useActionState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { initialActionState, type ActionState } from '@/lib/actions/types';
import type { Minerio } from '@/lib/queries/minerios';

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initial?: Minerio | null;
  submitLabel: string;
  onCancelHref: string;
};

export function MinerioForm({ action, initial, submitLabel, onCancelHref }: Props) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  const num = (name: keyof Minerio, label: string, step = '0.01') => (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type="number"
        step={step}
        defaultValue={initial?.[name] == null ? '' : String(initial[name])}
        required
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

      {num('preco_ton', 'Preço R$/ton')}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Composição química (%)</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {num('fe_pct', 'Fe', '0.01')}
          {num('sio2_pct', 'SiO₂', '0.01')}
          {num('al2o3_pct', 'Al₂O₃', '0.01')}
          {num('p_pct', 'P', '0.0001')}
          {num('mn_pct', 'Mn', '0.0001')}
          {num('cao_pct', 'CaO', '0.01')}
          {num('mgo_pct', 'MgO', '0.01')}
          {num('ppc_pct', 'PPC', '0.01')}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Tributação</h2>
        <div className="grid grid-cols-2 gap-4">
          {num('pis_credito_ton', 'PIS crédito (R$/ton)')}
          {num('icms_credito_ton', 'ICMS crédito (R$/ton)')}
        </div>
      </section>

      <div className="flex items-center gap-2">
        <input
          id="analise_validada"
          name="analise_validada"
          type="checkbox"
          defaultChecked={initial?.analise_validada ?? false}
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="analise_validada" className="cursor-pointer">
          Análise validada laboratorialmente
        </Label>
      </div>

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
