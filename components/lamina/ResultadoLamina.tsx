import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ClienteSpec, LaminaResultado } from '@/lib/calculation/types';

import { ClassificacaoBanner } from './ClassificacaoBanner';

const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (n: number, digits = 2) =>
  `${n.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
const num = (n: number, digits = 2) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

function Row({ label, value, flag }: { label: string; value: string; flag?: 'ok' | 'warn' | 'err' }) {
  const color =
    flag === 'ok' ? 'text-emerald-600' : flag === 'warn' ? 'text-amber-600' : flag === 'err' ? 'text-destructive' : '';
  return (
    <div className="flex items-baseline justify-between gap-4 border-b py-1.5 last:border-none">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

export function ResultadoLamina({
  r,
  cliente,
}: {
  r: LaminaResultado;
  cliente: ClienteSpec;
}) {
  const esc = r.escoria;
  const gusa = r.gusa;
  const fin = r.financeiro;
  const prod = r.producao;

  const flagSpec = (ok: boolean, value: number, max: number) =>
    !ok ? 'err' : max - value < 0.05 * max ? 'warn' : 'ok';

  return (
    <div className="space-y-4">
      <ClassificacaoBanner validacao={r.validacao} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card data-testid="card-producao">
          <CardHeader>
            <CardTitle className="text-base">Produção</CardTitle>
            <CardDescription>Por corrida (1h30)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            <Row label="Rendimento teórico" value={pct(prod.rendimentoTeorico * 100, 2)} />
            <Row label="Fator estabilidade" value={num(prod.fatorEstabilidade, 2)} />
            <Row label="Rendimento efetivo" value={pct(prod.rendimentoEfetivo * 100, 2)} />
            <Row label="Consumo minério" value={`${num(prod.consumoMinerioCorrida)} ton`} />
            <Row label="Gusa vazado" value={`${num(prod.gusaVazado)} ton`} />
            <Row label="Sucata gerada" value={`${num(prod.sucataGerada)} ton`} />
            <Row label="Produção total" value={`${num(prod.producaoTotal)} ton`} />
          </CardContent>
        </Card>

        <Card data-testid="card-escoria">
          <CardHeader>
            <CardTitle className="text-base">Escória</CardTitle>
            <CardDescription>Basicidades e composição</CardDescription>
          </CardHeader>
          <CardContent>
            <Row
              label="B2 (CaO/SiO₂)"
              value={num(esc.b2, 3)}
              flag={r.validacao.escoria.b2OK ? 'ok' : 'warn'}
            />
            <Row label="B4" value={num(esc.b4, 3)} />
            <Row
              label="Al₂O₃ na escória"
              value={pct(esc.al2o3Pct, 2)}
              flag={r.validacao.escoria.al2o3OK ? (esc.al2o3Pct > 16 ? 'warn' : 'ok') : 'err'}
            />
            <Row
              label="MgO/Al₂O₃"
              value={num(esc.mgoAl2o3, 3)}
              flag={r.validacao.escoria.mgoAl2o3OK ? 'ok' : 'warn'}
            />
            <Row label="Volume escória" value={`${num(esc.volumeTon)} ton`} />
            <Row label="kg escória/ton gusa" value={num(esc.volumePorTonGusa, 1)} />
            <Row label="Calcário necessário" value={`${num(esc.calcarioNecessario)} ton`} />
          </CardContent>
        </Card>

        <Card data-testid="card-gusa">
          <CardHeader>
            <CardTitle className="text-base">Qualidade do gusa</CardTitle>
            <CardDescription>vs spec do cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <Row
              label={`P (máx ${cliente.pMax}%)`}
              value={pct(gusa.p, 3)}
              flag={flagSpec(r.validacao.specCliente.p, gusa.p, cliente.pMax)}
            />
            <Row
              label={`Si (máx ${cliente.siMax}%)`}
              value={pct(gusa.si, 3)}
              flag={flagSpec(r.validacao.specCliente.si, gusa.si, cliente.siMax)}
            />
            <Row
              label={`Mn (máx ${cliente.mnMax}%)`}
              value={pct(gusa.mn, 3)}
              flag={flagSpec(r.validacao.specCliente.mn, gusa.mn, cliente.mnMax)}
            />
            <Row
              label={`S (máx ${cliente.sMax}%)`}
              value={pct(gusa.s, 3)}
              flag={flagSpec(r.validacao.specCliente.s, gusa.s, cliente.sMax)}
            />
            <Row
              label={`C (${cliente.cMin}–${cliente.cMax}%)`}
              value={pct(gusa.c, 2)}
              flag={r.validacao.specCliente.c ? 'ok' : 'err'}
            />
          </CardContent>
        </Card>

        <Card data-testid="card-financeiro">
          <CardHeader>
            <CardTitle className="text-base">Financeiro</CardTitle>
            <CardDescription>Por corrida + projeção mensal</CardDescription>
          </CardHeader>
          <CardContent>
            <Row label="Custo matérias" value={brl(fin.custoMaterias)} />
            <Row label="Custo quebras" value={brl(fin.custoQuebras)} />
            <Row label="Custo fixo" value={brl(fin.custoFixo)} />
            <Row label="Frete" value={brl(fin.custoFrete)} />
            <Row label="Tributos líquidos" value={brl(fin.tributosLiquidos)} />
            <Row label="Custo total" value={brl(fin.custoTotal)} />
            <Row label="Custo/ton gusa" value={brl(fin.custoPorTonGusa)} />
            <Row label="Receita gusa" value={brl(fin.receitaGusa)} />
            <Row label="Receita sucata" value={brl(fin.receitaSucata)} />
            {fin.creditoFuturoReprocesso > 0 ? (
              <Row label="Crédito futuro (reprocesso)" value={brl(fin.creditoFuturoReprocesso)} />
            ) : null}
            <Row label="Margem/ton" value={brl(fin.margemPorTon)} />
            <Row
              label="Resultado/corrida"
              value={brl(fin.resultadoCorrida)}
              flag={fin.resultadoCorrida > 0 ? 'ok' : 'err'}
            />
            <Row
              label="Resultado/mês projetado"
              value={brl(fin.resultadoProjetadoMes)}
              flag={fin.resultadoProjetadoMes > 0 ? 'ok' : 'err'}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
