'use client';

import { useActionState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { initialActionState, type ActionState } from '@/lib/actions/types';

type Gusa = { p?: number | null; si?: number | null; mn?: number | null; s?: number | null; c?: number | null };
type Escoria = {
  b2?: number | null;
  b4?: number | null;
  al2o3Pct?: number | null;
  mgoAl2o3?: number | null;
  volumeTon?: number | null;
};

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  initialGusa?: Gusa | null;
  initialEscoria?: Escoria | null;
};

function val(n: number | null | undefined): string {
  return n == null || !Number.isFinite(n) ? '' : String(n);
}

export function AnaliseQuimicaForm({ action, initialGusa, initialEscoria }: Props) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="space-y-4" data-testid="analise-form">
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gusa (%)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(['p', 'si', 'mn', 's', 'c'] as const).map((k) => (
              <div key={k} className="space-y-1">
                <Label htmlFor={`gusa_${k}`} className="text-xs uppercase">
                  {k}
                </Label>
                <Input
                  id={`gusa_${k}`}
                  name={`gusa_${k}`}
                  type="number"
                  step="0.001"
                  defaultValue={val(initialGusa?.[k])}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Escória</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {(
              [
                { k: 'b2', label: 'B2' },
                { k: 'b4', label: 'B4' },
                { k: 'al2o3Pct', label: 'Al₂O₃ (%)' },
                { k: 'mgoAl2o3', label: 'MgO/Al₂O₃' },
                { k: 'volumeTon', label: 'Volume (ton)' },
              ] as const
            ).map(({ k, label }) => (
              <div key={k} className="space-y-1">
                <Label htmlFor={`escoria_${k}`} className="text-xs">
                  {label}
                </Label>
                <Input
                  id={`escoria_${k}`}
                  name={`escoria_${k}`}
                  type="number"
                  step="0.001"
                  defaultValue={val(initialEscoria?.[k])}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <Button type="submit" disabled={pending} data-testid="salvar-analise">
          {pending ? 'Salvando…' : 'Salvar análise química'}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Deixe em branco o que ainda não foi medido. O snapshot previsto não
          muda; os desvios recalculam ao salvar.
        </p>
      </div>
    </form>
  );
}
