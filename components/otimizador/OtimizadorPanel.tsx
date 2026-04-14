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
  const [al2o3Max, setAl2o3Max] = useState('17');
  const [custoMax, setCustoMax] = useState('');

  // Parâmetros de operação (defaults do bootstrap)
  const [carvaoMdc, setCarvaoMdc] = useState(23.3);
  const [coqueKg, setCoqueKg] = useState(1280);
  const [bauxitaKg, setBauxitaKg] = useState(192.5);
  const [dolomitaKg, setDolomitaKg] = useState(0);

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
      carvao_densidade: Number(carvao.densidade_kg_m3 ?? 220),
      coque_kg: coqueKg,
      calcario_kg: 0,
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
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <Label htmlFor="carvaoMdc" className="text-xs">Carvão (MDC)</Label>
                <Input id="carvaoMdc" type="number" step="0.01" value={carvaoMdc} onChange={(e) => setCarvaoMdc(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="coqueKg" className="text-xs">Coque (kg)</Label>
                <Input id="coqueKg" type="number" step="0.01" value={coqueKg} onChange={(e) => setCoqueKg(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bauxitaKg" className="text-xs">Bauxita (kg)</Label>
                <Input id="bauxitaKg" type="number" step="0.01" value={bauxitaKg} onChange={(e) => setBauxitaKg(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dolomitaKg" className="text-xs">Dolomita (kg)</Label>
                <Input id="dolomitaKg" type="number" step="0.01" value={dolomitaKg} onChange={(e) => setDolomitaKg(Number(e.target.value))} />
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
            <AlertDescription>
              Nenhuma combinação atende às restrições. Relaxe filtros ou altere o step.
            </AlertDescription>
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
