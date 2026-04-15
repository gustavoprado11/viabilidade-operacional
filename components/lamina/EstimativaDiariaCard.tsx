import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { EstimativaDiaria } from '@/lib/laminas/estimativa-diaria';

type Props = { estimativa: EstimativaDiaria };

const fmtTon = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function fmtReais(v: number): string {
  const abs = Math.abs(v);
  const decimais = abs >= 1000 || Number.isInteger(v) ? 0 : 0;
  return `R$ ${v.toLocaleString('pt-BR', {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  })}`;
}

export function EstimativaDiariaCard({ estimativa }: Props) {
  if (estimativa.n === 0) {
    return (
      <Card data-testid="estimativa-diaria-placeholder">
        <CardContent className="py-4 text-sm text-muted-foreground">
          Aplique filtros para ver estimativa diária.
        </CardContent>
      </Card>
    );
  }

  const { viavel, alerta, inviavel } = estimativa.classificacoes;

  return (
    <Card data-testid="estimativa-diaria">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Estimativa diária ({estimativa.n} lâmina{estimativa.n === 1 ? '' : 's'} filtrada{estimativa.n === 1 ? '' : 's'})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric label="Gusa/dia" value={`${fmtTon.format(estimativa.gusaDia)} ton`} testid="gusa-dia" />
          <Metric label="Custo/ton" value={fmtReais(estimativa.mediaCustoTon)} testid="custo-ton" />
          <Metric label="Margem/ton" value={fmtReais(estimativa.mediaMargemTon)} testid="margem-ton" />
          <Metric label="Resultado/dia" value={fmtReais(estimativa.resultadoDia)} testid="resultado-dia" />
          <Metric label="Resultado/mês" value={fmtReais(estimativa.resultadoMes)} testid="resultado-mes" />
          <Metric
            label="Viáv/Alert/Inv"
            value={`${viavel} / ${alerta} / ${inviavel}`}
            testid="classificacoes"
          />
        </div>
        {estimativa.observacoes.length > 0 ? (
          <ul className="text-xs text-muted-foreground" data-testid="estimativa-observacoes">
            {estimativa.observacoes.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  testid,
}: {
  label: string;
  value: string;
  testid: string;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-base font-semibold" data-testid={`estimativa-${testid}`}>
        {value}
      </div>
    </div>
  );
}
