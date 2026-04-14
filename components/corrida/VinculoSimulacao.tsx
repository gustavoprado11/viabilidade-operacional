import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Simulacao } from '@/lib/queries/simulacoes';

type Props = { origem: Simulacao | null };

export function VinculoSimulacao({ origem }: Props) {
  if (!origem) {
    return (
      <Card data-testid="vinculo-simulacao">
        <CardHeader>
          <CardTitle className="text-base">Simulação de origem</CardTitle>
          <CardDescription>
            Esta corrida não está vinculada a uma simulação prévia.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return (
    <Card data-testid="vinculo-simulacao">
      <CardHeader>
        <CardTitle className="text-base">Simulação de origem</CardTitle>
        <CardDescription>
          Corrida baseada em{' '}
          <Link href={`/laminas/${origem.id}`} className="underline">
            {origem.nome}
          </Link>{' '}
          · classificação {origem.classificacao}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Criada em {new Date(origem.created_at).toLocaleString('pt-BR')}.
      </CardContent>
    </Card>
  );
}
