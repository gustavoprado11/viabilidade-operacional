'use client';

import { useActionState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { initialActionState, type ActionState } from '@/lib/actions/types';
import type { Cliente } from '@/lib/queries/clientes';

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initial?: Cliente | null;
  submitLabel: string;
  onCancelHref: string;
};

export function ClienteForm({ action, initial, submitLabel, onCancelHref }: Props) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  const field = (name: keyof Cliente, defaultValue: unknown, label: string, extra: Partial<React.InputHTMLAttributes<HTMLInputElement>> = {}) => (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        defaultValue={defaultValue === null || defaultValue === undefined ? '' : String(defaultValue)}
        aria-invalid={state.fieldErrors?.[name] ? true : undefined}
        {...extra}
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

      {field('nome', initial?.nome, 'Nome', { required: true })}
      {field('cnpj', initial?.cnpj, 'CNPJ (opcional)')}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {field('p_max', initial?.p_max, 'P máx (%)', { type: 'number', step: '0.001', required: true })}
        {field('si_max', initial?.si_max, 'Si máx (%)', { type: 'number', step: '0.001', required: true })}
        {field('mn_max', initial?.mn_max, 'Mn máx (%)', { type: 'number', step: '0.001', required: true })}
        {field('s_max', initial?.s_max, 'S máx (%)', { type: 'number', step: '0.001', required: true })}
        {field('c_min', initial?.c_min, 'C mín (%)', { type: 'number', step: '0.001', required: true })}
        {field('c_max', initial?.c_max, 'C máx (%)', { type: 'number', step: '0.001', required: true })}
      </div>

      {field('preco_gusa_ton', initial?.preco_gusa_ton, 'Preço gusa (R$/ton)', { type: 'number', step: '0.01', required: true })}

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
