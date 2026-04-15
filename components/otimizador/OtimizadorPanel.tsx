'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  buildLaminaInput,
  minerioRowToInput,
  type LaminaFormPayload,
} from '@/lib/actions/lamina-mapper';
import {
  CARGAS_PADRAO,
  PESO_POR_CARGA_PADRAO_KG,
  calcularMdc,
} from '@/lib/laminas/mdc-calc';
import type { LaminaResultado } from '@/lib/calculation/types';
import type { Database } from '@/lib/supabase/types';

import { ResultadosTabela } from './ResultadosTabela';

type MinerioRow = Database['public']['Tables']['minerios']['Row'];
type InsumoRow = Database['public']['Tables']['insumos']['Row'];
type ClienteRow = Database['public']['Tables']['clientes']['Row'];
type ParamRow = Database['public']['Tables']['parametros_forno']['Row'];

type OtimizacaoResult = LaminaResultado & {
  blendStr: string;
  pcts: number[];
};

type Props = {
  minerios: MinerioRow[];
  clientes: ClienteRow[];
  calcario: InsumoRow;
  bauxita: InsumoRow;
  dolomita: InsumoRow;
  carvao: InsumoRow;
  coque: InsumoRow;
  parametros: ParamRow;
};

const QUEBRAS_DEFAULT = { minerio: 0.1, carvao: 0.1, coque: 0.05, fundentes: 0.05 };
const STEP_OPTIONS = [1, 2, 5, 10, 20, 25];

function buildEmptyMsg(
  al2o3MaxStr: string,
  custoMaxStr: string,
  dolomitaKg: number,
): string {
  const al2o3 = al2o3MaxStr ? Number(al2o3MaxStr) : NaN;
  const custo = custoMaxStr ? Number(custoMaxStr) : NaN;
  if (Number.isFinite(al2o3) && al2o3 < 20) {
    const dolomitaHint =
      dolomitaKg < 5000
        ? ' (2) aumentar dolomita para 5000-10000 kg/corrida (aumenta MgO, pode diluir Al₂O₃%);'
        : '';
    return `Nenhum blend atende Al₂O₃ escória < ${al2o3}%. Com minérios itabiríticos e sem cinzas no modelo, esse limite é muito estrito. Sugestões: (1) aumentar para 22-25%;${dolomitaHint} (3) reduzir bauxita.`;
  }
  if (Number.isFinite(custo) && custo < 2500) {
    return `Custo/ton máximo (R$ ${custo}) pode estar restritivo. Média de referência: R$ 2.600-2.800/ton.`;
  }
  return 'Nenhuma combinação atende às restrições. Relaxe filtros ou altere o step.';
}

export function OtimizadorPanel(props: Props) {
  const {
    minerios,
    clientes,
    calcario,
    bauxita,
    dolomita,
    carvao,
    coque,
    parametros,
  } = props;

  const router = useRouter();

  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? '');
  const [selecionados, setSelecionados] = useState<string[]>(
    minerios.slice(0, 3).map((m) => m.id),
  );
  const [step, setStep] = useState(5);
  const [feMin, setFeMin] = useState('');
  const [feMax, setFeMax] = useState('');
  const [al2o3Max, setAl2o3Max] = useState('25');
  const [custoMax, setCustoMax] = useState('');

  // Parâmetros de operação (defaults do bootstrap)
  const carvaoDens = Number(carvao.densidade_kg_m3 ?? 220);
  const [carvaoCargas, setCarvaoCargas] = useState<number>(CARGAS_PADRAO);
  const [carvaoPesoCarga, setCarvaoPesoCarga] = useState<number>(
    PESO_POR_CARGA_PADRAO_KG,
  );
  const carvaoMdc = calcularMdc(carvaoCargas, carvaoPesoCarga, carvaoDens);
  const [coqueKg, setCoqueKg] = useState(1280);
  const [bauxitaKg, setBauxitaKg] = useState(192.5);
  const [dolomitaKg, setDolomitaKg] = useState(0);
  const [calcarioMode, setCalcarioMode] = useState<'auto' | 'manual'>('auto');
  const [calcarioKg, setCalcarioKg] = useState(0);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultados, setResultados] = useState<OtimizacaoResult[] | null>(null);
  const [tempoMs, setTempoMs] = useState<number | null>(null);
  const [combinacoes, setCombinacoes] = useState<number | null>(null);

  const cliente = clientes.find((c) => c.id === clienteId);
  const mineriosSelecionados = minerios.filter((m) => selecionados.includes(m.id));

  const nMinerios = selecionados.length;
  const aviso4plus = nMinerios >= 4;
  const podeOtimizar = nMinerios >= 2 && nMinerios <= 5 && !!clienteId;

  const toggleMinerio = (id: string) => {
    setSelecionados((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  };

  const handleOtimizar = async () => {
    if (!cliente) return;
    setLoading(true);
    setErro(null);
    setResultados(null);

    // Monta baseInput (sem blend) via buildLaminaInput com um blend-dummy,
    // depois remove blend antes de enviar.
    const dummyPayload: LaminaFormPayload = {
      nome: '__otimizacao__',
      tipo: 'simulacao',
      cliente_id: clienteId,
      blend: mineriosSelecionados.length > 0
        ? [{ minerio_id: mineriosSelecionados[0]!.id, pct: 100 }]
        : [],
      carvao_mdc: carvaoMdc,
      carvao_densidade: carvaoDens,
      carvao_cargas_por_corrida: carvaoCargas,
      carvao_peso_por_carga_kg: carvaoPesoCarga,
      coque_kg: coqueKg,
      calcario_kg: calcarioMode === 'manual' ? calcarioKg : 0,
      calcario_manual: calcarioMode === 'manual',
      bauxita_kg: bauxitaKg,
      dolomita_kg: dolomitaKg,
      quebras: QUEBRAS_DEFAULT,
      estabilidade: 'estavel',
      sucata_kg: 0,
      sucata_preco_ton: 0,
      sucata_destino: 'venda',
    };

    const full = buildLaminaInput(dummyPayload, {
      minerios: mineriosSelecionados,
      cliente,
      calcario,
      bauxita,
      dolomita,
      carvao,
      coque,
      parametros,
    });

    const { blend: _blend, ...baseInput } = full;
    void _blend;

    const payload = {
      restricoes: {
        ...(feMin ? { feMin: Number(feMin) } : {}),
        ...(feMax ? { feMax: Number(feMax) } : {}),
        ...(al2o3Max ? { al2o3EscoriaMax: Number(al2o3Max) } : {}),
        ...(custoMax ? { custoTonMax: Number(custoMax) } : {}),
      },
      baseInput,
      minerios: mineriosSelecionados.map((m) => minerioRowToInput(m)),
      step,
      topN: 10,
    };

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 30_000);

    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ac.signal,
      });
      const json = await res.json();
      if (!res.ok) {
        setErro(json.error ?? 'Erro na otimização.');
      } else {
        setResultados(json.blends);
        setTempoMs(json.tempoMs);
        setCombinacoes(json.combinacoes);
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        setErro('Otimização excedeu 30 s. Reduza minérios ou aumente o step.');
      } else {
        setErro(`Falha: ${(e as Error).message}`);
      }
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  };

  const abrirComoSimulacao = (r: OtimizacaoResult) => {
    const blend = mineriosSelecionados.map((m, i) => ({
      minerio_id: m.id,
      pct: r.pcts[i]!,
    }));
    const params = new URLSearchParams({
      blend: JSON.stringify(blend),
      cliente_id: clienteId,
      carvao_mdc: String(carvaoMdc),
      carvao_cargas_por_corrida: String(carvaoCargas),
      carvao_peso_por_carga_kg: String(carvaoPesoCarga),
      coque_kg: String(coqueKg),
      bauxita_kg: String(bauxitaKg),
      dolomita_kg: String(dolomitaKg),
      nome: `Otimização ${new Date().toLocaleDateString('pt-BR')} — ${r.blendStr}`,
    });
    router.push(`/laminas/nova?${params.toString()}`);
  };

  const todosInviavel = useMemo(
    () =>
      resultados !== null &&
      resultados.length > 0 &&
      resultados.every((r) => r.validacao.classificacao === 'inviavel'),
    [resultados],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Restrições</CardTitle>
          <CardDescription>
            Cliente + filtros opcionais + minérios do blend.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cliente_id">Cliente</Label>
            <select
              id="cliente_id"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            {cliente ? (
              <p className="text-xs text-muted-foreground">
                Spec: P≤{cliente.p_max}% · Si≤{cliente.si_max}% · Mn≤{cliente.mn_max}% ·
                S≤{cliente.s_max}% · C∈[{cliente.c_min}, {cliente.c_max}]% ·
                R$ {Number(cliente.preco_gusa_ton).toFixed(2)}/t
              </p>
            ) : null}
          </div>

          <div>
            <Label>Minérios ({nMinerios}/5)</Label>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {minerios.map((m) => {
                const checked = selecionados.includes(m.id);
                const atLimit = !checked && selecionados.length >= 5;
                return (
                  <label
                    key={m.id}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${checked ? 'border-primary bg-accent/40' : ''} ${atLimit ? 'opacity-50' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={atLimit}
                      onChange={() => toggleMinerio(m.id)}
                      data-testid={`opt-minerio-${m.nome}`}
                    />
                    <span>{m.nome}</span>
                  </label>
                );
              })}
            </div>
            {aviso4plus ? (
              <p className="mt-1 text-xs text-amber-600">
                ⚠ {nMinerios} minérios: combinações crescem — considere step ≥10.
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="step" className="text-xs">Step do grid</Label>
              <select
                id="step"
                value={step}
                onChange={(e) => setStep(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {STEP_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}%</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="feMin" className="text-xs">Fe mín (%)</Label>
              <Input id="feMin" type="number" step="0.01" value={feMin} onChange={(e) => setFeMin(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="feMax" className="text-xs">Fe máx (%)</Label>
              <Input id="feMax" type="number" step="0.01" value={feMax} onChange={(e) => setFeMax(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="al2o3Max" className="text-xs">Al₂O₃ esc máx (%)</Label>
              <Input id="al2o3Max" type="number" step="0.01" value={al2o3Max} onChange={(e) => setAl2o3Max(e.target.value)} />
              <p className="text-[10px] leading-tight text-muted-foreground">
                17% é o alvo técnico, mas modelo atual sem cinzas de carvão/coque tende a superestimar Al₂O₃ escória. Use 25% para exploração inicial; reduza para 17% se quiser regime estrito.
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="custoMax" className="text-xs">Custo/ton máx (R$)</Label>
              <Input id="custoMax" type="number" step="0.01" value={custoMax} onChange={(e) => setCustoMax(e.target.value)} />
            </div>
          </div>

          <details className="rounded-md border p-3 text-sm">
            <summary className="cursor-pointer text-muted-foreground">
              Parâmetros de operação (defaults)
            </summary>
            <div className="mt-3 space-y-3 rounded-md border p-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">Carvão vegetal</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  por corrida
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="carvaoCargas" className="text-xs">Cargas na corrida</Label>
                  <Input
                    id="carvaoCargas"
                    type="number"
                    step="0.01"
                    min="0"
                    value={carvaoCargas}
                    onChange={(e) => setCarvaoCargas(Number(e.target.value))}
                    data-testid="opt-carvao-cargas"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="carvaoPesoCarga" className="text-xs">Peso por carga (kg)</Label>
                  <Input
                    id="carvaoPesoCarga"
                    type="number"
                    step="0.01"
                    min="0"
                    value={carvaoPesoCarga}
                    onChange={(e) => setCarvaoPesoCarga(Number(e.target.value))}
                    data-testid="opt-carvao-peso"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">MDC/corrida calculado</Label>
                  <div
                    className="flex h-10 items-center rounded-md border bg-muted/40 px-3 text-sm font-semibold tabular-nums"
                    data-testid="opt-carvao-mdc"
                  >
                    {carvaoMdc.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>
              <div
                className="flex items-baseline justify-between border-t pt-2 text-xs"
                data-testid="opt-carvao-peso-total"
              >
                <span className="text-muted-foreground">
                  Peso total/corrida (kg)
                </span>
                <span className="font-semibold tabular-nums">
                  {(carvaoCargas * carvaoPesoCarga).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="coqueKg" className="text-xs">Coque (total na corrida, kg)</Label>
                <Input id="coqueKg" type="number" step="0.01" value={coqueKg} onChange={(e) => setCoqueKg(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bauxitaKg" className="text-xs">Bauxita (total na corrida, kg)</Label>
                <Input id="bauxitaKg" type="number" step="0.01" value={bauxitaKg} onChange={(e) => setBauxitaKg(Number(e.target.value))} />
                <p className="text-[10px] leading-tight text-muted-foreground">
                  Quantidade fixa em todas combinações testadas.
                </p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="dolomitaKg" className="text-xs">Dolomita (total na corrida, kg)</Label>
                <Input id="dolomitaKg" type="number" step="0.01" value={dolomitaKg} onChange={(e) => setDolomitaKg(Number(e.target.value))} data-testid="opt-dolomita" />
                <p className="text-[10px] leading-tight text-muted-foreground">
                  Zero = sem dolomita. Valores &gt; 0 aumentam MgO/Al₂O₃ da escória, podendo reduzir Al₂O₃% via diluição.
                </p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="calcarioMode" className="text-xs">
                  Calcário (total na corrida, kg)
                </Label>
                <div className="flex items-center gap-2">
                  <select
                    id="calcarioMode"
                    value={calcarioMode}
                    onChange={(e) => setCalcarioMode(e.target.value as 'auto' | 'manual')}
                    className="flex h-10 w-32 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="auto">automático</option>
                    <option value="manual">manual</option>
                  </select>
                  <Input
                    type="number"
                    step="0.01"
                    value={calcarioKg}
                    onChange={(e) => setCalcarioKg(Number(e.target.value))}
                    disabled={calcarioMode === 'auto'}
                    placeholder={calcarioMode === 'auto' ? 'recalculado para B2 alvo' : 'kg'}
                  />
                </div>
              </div>
            </div>
          </details>

          <Button
            onClick={handleOtimizar}
            disabled={!podeOtimizar || loading}
            data-testid="otimizar"
          >
            {loading ? 'Otimizando…' : 'Otimizar'}
          </Button>
        </CardContent>
      </Card>

      {erro ? (
        <Alert variant="destructive" data-testid="otimizador-erro">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <Alert>
          <AlertDescription>
            Rodando grid search… (até 30 s)
          </AlertDescription>
        </Alert>
      ) : null}

      {resultados !== null && !loading ? (
        resultados.length === 0 ? (
          <Alert data-testid="sem-resultados">
            <AlertDescription>{buildEmptyMsg(al2o3Max, custoMax, dolomitaKg)}</AlertDescription>
          </Alert>
        ) : (
          <>
            <div
              className="flex items-center justify-between text-xs text-muted-foreground"
              data-testid="otimizacao-stats"
            >
              <span>
                Top {resultados.length} de {combinacoes} combinações · {tempoMs} ms
              </span>
              {todosInviavel ? (
                <span className="text-destructive" data-testid="todos-inviavel">
                  ⚠ Nenhum viável encontrado
                </span>
              ) : null}
            </div>
            <ResultadosTabela
              resultados={resultados}
              minerios={mineriosSelecionados}
              onAbrir={abrirComoSimulacao}
            />
          </>
        )
      ) : null}
    </div>
  );
}
