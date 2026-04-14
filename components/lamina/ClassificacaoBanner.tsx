import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { LaminaResultado } from '@/lib/calculation/types';

export function ClassificacaoBanner({ validacao }: { validacao: LaminaResultado['validacao'] }) {
  if (validacao.classificacao === 'viavel') {
    return (
      <Alert variant="success" data-testid="classificacao-viavel">
        <CheckCircle2 />
        <AlertTitle>Viável</AlertTitle>
        <AlertDescription>Atende specs do cliente e restrições de escória.</AlertDescription>
      </Alert>
    );
  }
  if (validacao.classificacao === 'alerta') {
    return (
      <Alert data-testid="classificacao-alerta" className="border-amber-500/60 text-amber-800 dark:text-amber-300">
        <AlertTriangle />
        <AlertTitle>Viável com alertas</AlertTitle>
        <AlertDescription>
          <ul className="mt-1 list-disc pl-4 text-sm">
            {validacao.alertas.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <Alert variant="destructive" data-testid="classificacao-inviavel">
      <AlertCircle />
      <AlertTitle>Inviável</AlertTitle>
      <AlertDescription>
        <ul className="mt-1 list-disc pl-4 text-sm">
          {validacao.erros.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
