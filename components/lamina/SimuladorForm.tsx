'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';

import { ResultadoLamina } from '@/components/lamina/ResultadoLamina';
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
import { simulateLamina } from '@/lib/calculation';
import type {
  Estabilidade,
  LaminaInput,
  LaminaResultado,
  SucataDestino,
} from '@/lib/calculation/types';
import {
  buildLaminaInput,
  type LaminaFormPayload,
} from '@/lib/actions/lamina-mapper';
import { initialActionState, type ActionState } from '@/lib/actions/types';
import type { Database } from '@/lib/supabase/types';

type MinerioRow = Database['public']['Tables']['minerios']['Row'] & {
  arquivado?: boolean;
};
type InsumoRow = Database['public']['Tables']['insumos']['Row'];
type ClienteRow = Database['public']['Tables']['clientes']['Row'];
type ParamRow = Database['public']['Tables']['parametros_forno']['Row'];

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  minerios: MinerioRow[];
  mineriosArquivadosExtras?: MinerioRow[]; // incluir só para o modo edição
  clientes: ClienteRow[];
  calcario: InsumoRow;
  bauxita: InsumoRow;
  dolomita: InsumoRow;
  carvao: InsumoRow;
  coque: InsumoRow;
  parametros: ParamRow;
  initial?: Partial<LaminaFormPayload> & { id?: string };
  submitLabel: string;
};

const QUEBRAS_DEFAULT = { minerio: 0.1, carvao: 0.1, coque: 0.05, fundentes: 0.05 };

function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number) {
  let h: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (h) clearTimeout(h);
    h = setTimeout(() => fn(...args), ms);
  };
}

export function SimuladorForm(props: Props) {
  const {
    action,
    minerios,
    mineriosArquivadosExtras = [],
    clientes,
    calcario,
    bauxita,
    dolomita,
    carvao,
    coque,
    parametros,
    initial,
    submitLabel,
  } = props;

  const [state, formAction, pending] = useActionState(action, initialActionState);

  const [nome, setNome] = useState(initial?.nome ?? 'Nova simulação');
  const [tipo, setTipo] = useState<'simulacao' | 'corrida_real'>(
    initial?.tipo ?? 'simulacao',
  );
  const [clienteId, setClienteId] = useState(
    initial?.cliente_id ?? clientes[0]?.id ?? '',
  );
  const activeMinerios = minerios;
  const allMineriosForSelect = [
    ...minerios,
    ...mineriosArquivadosExtras.filter(
      (m) => !minerios.some((a) => a.id === m.id),
    ),
  ];

  const defaultBlend = initial?.blend && initial.blend.length > 0
    ? initial.blend
    : activeMinerios.slice(0, 3).map((m, i, arr) => ({
        minerio_id: m.id,
        pct: i === 0 ? 100 - (arr.length - 1) * Math.floor(100 / arr.length) : Math.floor(100 / arr.length),
      }));

  const [blend, setBlend] = useState(defaultBlend);
  const [carvaoMdc, setCarvaoMdc] = useState(initial?.carvao_mdc ?? 23.3);
  const [carvaoDens, setCarvaoDens] = useState(
    initial?.carvao_densidade ?? Number(carvao.densidade_kg_m3 ?? 220),
  );
  const [coqueKg, setCoqueKg] = useState(initial?.coque_kg ?? 1280);
  const [calcarioKg, setCalcarioKg] = useState(initial?.calcario_kg ?? 0);
  const [bauxitaKg, setBauxitaKg] = useState(initial?.bauxita_kg ?? 192.5);
  const [dolomitaKg, setDolomitaKg] = useState(initial?.dolomita_kg ?? 0);
  const [quebras, setQuebras] = useState(initial?.quebras ?? QUEBRAS_DEFAULT);
  const [estabilidade, setEstabilidade] = useState<Estabilidade>(
    initial?.estabilidade ?? 'estavel',
  );
  const [sucataKg, setSucataKg] = useState(initial?.sucata_kg ?? 0);
  const [sucataPreco, setSucataPreco] = useState(initial?.sucata_preco_ton ?? 0);
  const [sucataDestino, setSucataDestino] = useState<SucataDestino>(
    initial?.sucata_destino ?? 'venda',
  );
  const [corridaTs, setCorridaTs] = useState(initial?.corrida_timestamp ?? '');
  const [observacoes, setObservacoes] = useState(initial?.observacoes ?? '');

  const somaBlend = blend.reduce((s, b) => s + Number(b.pct || 0), 0);
  const somaOK = Math.abs(somaBlend - 100) < 0.01;

  const cliente = clientes.find((c) => c.id === clienteId);

  // Live preview
  const [preview, setPreview] = useState<LaminaResultado | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const payload: LaminaFormPayload = useMemo(
    () => ({
      nome,
      tipo,
      cliente_id: clienteId,
      blend: blend.map((b) => ({ minerio_id: b.minerio_id, pct: Number(b.pct) })),
      carvao_mdc: Number(carvaoMdc),
      carvao_densidade: Number(carvaoDens),
      coque_kg: Number(coqueKg),
      calcario_kg: Number(calcarioKg),
      bauxita_kg: Number(bauxitaKg),
      dolomita_kg: Number(dolomitaKg),
      quebras: {
        minerio: Number(quebras.minerio),
        carvao: Number(quebras.carvao),
        coque: Number(quebras.coque),
        fundentes: Number(quebras.fundentes),
      },
      estabilidade,
      sucata_kg: Number(sucataKg),
      sucata_preco_ton: sucataDestino === 'venda' ? Number(sucataPreco) : 0,
      sucata_destino: sucataDestino,
      corrida_timestamp: corridaTs || null,
      observacoes: observacoes || null,
    }),
    [
      nome, tipo, clienteId, blend, carvaoMdc, carvaoDens, coqueKg, calcarioKg,
      bauxitaKg, dolomitaKg, quebras, estabilidade, sucataKg, sucataPreco,
      sucataDestino, corridaTs, observacoes,
    ],
  );

  useEffect(() => {
    if (!cliente || !somaOK) {
      setPreview(null);
      setPreviewError(
        !somaOK ? `Blend soma ${somaBlend.toFixed(2)}% — precisa 100%.` : 'Selecione um cliente.',
      );
      return;
    }
    setPreviewError(null);
    const run = debounce(() => {
      try {
        const input: LaminaInput = buildLaminaInput(payload, {
          minerios: allMineriosForSelect,
          cliente,
          calcario,
          bauxita,
          dolomita,
          carvao,
          coque,
          parametros,
        });
        const r = simulateLamina(input);
        setPreview(r);
      } catch (e) {
        setPreview(null);
        setPreviewError((e as Error).message);
      }
    }, 300);
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(payload)]);

  const setBlendItem = (i: number, patch: Partial<(typeof blend)[number]>) =>
    setBlend((prev) => prev.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));

  const addBlendLine = () => {
    const available = activeMinerios.filter(
      (m) => !blend.some((b) => b.minerio_id === m.id),
    );
    if (available.length === 0) return;
    setBlend((prev) => [...prev, { minerio_id: available[0]!.id, pct: 0 }]);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={formAction} className="space-y-6" data-testid="simulador-form">
        {/* hidden JSON fields */}
        <input type="hidden" name="blend" value={JSON.stringify(payload.blend)} />
        <input type="hidden" name="quebras" value={JSON.stringify(payload.quebras)} />

        {state.status === 'error' && state.message ? (
          <Alert variant="destructive" data-testid="form-error">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Identificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="tipo"
                    value="simulacao"
                    checked={tipo === 'simulacao'}
                    onChange={() => setTipo('simulacao')}
                  />
                  Simulação
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="tipo"
                    value="corrida_real"
                    checked={tipo === 'corrida_real'}
                    onChange={() => setTipo('corrida_real')}
                  />
                  Corrida real
                </label>
              </div>
            </div>
            {tipo === 'corrida_real' ? (
              <div className="space-y-2">
                <Label htmlFor="corrida_timestamp">Data/hora da corrida</Label>
                <Input
                  id="corrida_timestamp"
                  name="corrida_timestamp"
                  type="datetime-local"
                  value={corridaTs ?? ''}
                  onChange={(e) => setCorridaTs(e.target.value)}
                  required
                />
              </div>
            ) : (
              <input type="hidden" name="corrida_timestamp" value="" />
            )}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Input
                id="observacoes"
                name="observacoes"
                value={observacoes ?? ''}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
            {cliente ? (
              <CardDescription>
                Spec: P≤{cliente.p_max}% · Si≤{cliente.si_max}% · Mn≤{cliente.mn_max}% · S≤{cliente.s_max}% ·
                C∈[{cliente.c_min}, {cliente.c_max}]% · R$ {Number(cliente.preco_gusa_ton).toFixed(2)}/t
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent>
            <select
              id="cliente_id"
              name="cliente_id"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              required
            >
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                  {c.valid_to ? ' (arquivado)' : ''}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Blend</CardTitle>
            <CardDescription>
              Soma: <span className={somaOK ? 'text-emerald-600' : 'text-destructive'}>{somaBlend.toFixed(2)}%</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {blend.map((item, i) => {
              const m = allMineriosForSelect.find((x) => x.id === item.minerio_id);
              const isArquivado = m?.arquivado;
              return (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={item.minerio_id}
                    onChange={(e) => setBlendItem(i, { minerio_id: e.target.value })}
                    className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {activeMinerios.map((mm) => (
                      <option key={mm.id} value={mm.id}>
                        {mm.nome}
                      </option>
                    ))}
                    {isArquivado ? (
                      <option value={item.minerio_id} disabled>
                        {m?.nome} (arquivado — não pode ser escolhido para novos itens)
                      </option>
                    ) : null}
                  </select>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.pct}
                    onChange={(e) => setBlendItem(i, { pct: Number(e.target.value) })}
                    className="w-24"
                    aria-label={`pct ${i}`}
                  />
                  <span className="text-sm">%</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBlend((prev) => prev.filter((_, idx) => idx !== i))}
                    disabled={blend.length <= 1}
                  >
                    Remover
                  </Button>
                </div>
              );
            })}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addBlendLine}
              disabled={blend.length >= activeMinerios.length}
            >
              Adicionar minério
            </Button>
            {!somaOK ? (
              <p className="text-sm text-destructive" data-testid="blend-error">
                A soma do blend deve ser exatamente 100%.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Carvão, coque e fundentes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="carvao_mdc">Carvão (MDC/corrida)</Label>
              <Input id="carvao_mdc" name="carvao_mdc" type="number" step="0.01" value={carvaoMdc} onChange={(e) => setCarvaoMdc(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carvao_densidade">Densidade carvão (kg/m³)</Label>
              <Input id="carvao_densidade" name="carvao_densidade" type="number" step="0.01" value={carvaoDens} onChange={(e) => setCarvaoDens(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coque_kg">Coque (kg/corrida)</Label>
              <Input id="coque_kg" name="coque_kg" type="number" step="0.01" value={coqueKg} onChange={(e) => setCoqueKg(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bauxita_kg">Bauxita (kg/corrida)</Label>
              <Input id="bauxita_kg" name="bauxita_kg" type="number" step="0.01" value={bauxitaKg} onChange={(e) => setBauxitaKg(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dolomita_kg">Dolomita (kg/corrida)</Label>
              <Input id="dolomita_kg" name="dolomita_kg" type="number" step="0.01" value={dolomitaKg} onChange={(e) => setDolomitaKg(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calcario_kg">Calcário (kg/corrida) — informativo</Label>
              <Input id="calcario_kg" name="calcario_kg" type="number" step="0.01" value={calcarioKg} onChange={(e) => setCalcarioKg(Number(e.target.value))} />
              <p className="text-xs text-muted-foreground">
                O motor recalcula o calcário para atingir B2 alvo.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Estabilidade</Label>
              <div className="mt-2 flex gap-2">
                {(['estavel', 'atencao', 'instavel'] as Estabilidade[]).map((e) => (
                  <label key={e} className="flex items-center gap-2 text-sm">
                    <input type="radio" name="estabilidade" value={e} checked={estabilidade === e} onChange={() => setEstabilidade(e)} />
                    {e}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label>Quebras (%)</Label>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(['minerio', 'carvao', 'coque', 'fundentes'] as const).map((k) => (
                  <div key={k} className="space-y-1">
                    <Label htmlFor={`quebra_${k}`} className="text-xs">{k}</Label>
                    <Input
                      id={`quebra_${k}`}
                      type="number"
                      step="0.01"
                      value={quebras[k]}
                      onChange={(e) => setQuebras({ ...quebras, [k]: Number(e.target.value) })}
                    />
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setQuebras(QUEBRAS_DEFAULT)}>
                Valores padrão
              </Button>
            </div>

            <div className="space-y-3">
              <Label>Sucata</Label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="sucata_kg" className="text-xs">kg/corrida</Label>
                  <Input id="sucata_kg" name="sucata_kg" type="number" step="0.01" value={sucataKg} onChange={(e) => setSucataKg(Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sucata_destino" className="text-xs">Destino</Label>
                  <select
                    id="sucata_destino"
                    name="sucata_destino"
                    value={sucataDestino}
                    onChange={(e) => setSucataDestino(e.target.value as SucataDestino)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="venda">Venda</option>
                    <option value="reprocesso">Reprocesso</option>
                  </select>
                </div>
                {sucataDestino === 'venda' ? (
                  <div className="space-y-1">
                    <Label htmlFor="sucata_preco_ton" className="text-xs">R$/ton</Label>
                    <Input id="sucata_preco_ton" name="sucata_preco_ton" type="number" step="0.01" value={sucataPreco} onChange={(e) => setSucataPreco(Number(e.target.value))} />
                  </div>
                ) : (
                  <input type="hidden" name="sucata_preco_ton" value="0" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={pending || !somaOK} data-testid="submit">
            {pending ? 'Salvando…' : submitLabel}
          </Button>
        </div>
      </form>

      <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <h2 className="text-lg font-semibold">Resultado (preview)</h2>
        {preview ? (
          cliente ? (
            <ResultadoLamina
              r={preview}
              cliente={{
                pMax: Number(cliente.p_max),
                siMax: Number(cliente.si_max),
                mnMax: Number(cliente.mn_max),
                sMax: Number(cliente.s_max),
                cMin: Number(cliente.c_min),
                cMax: Number(cliente.c_max),
                precoGusa: Number(cliente.preco_gusa_ton),
              }}
            />
          ) : null
        ) : (
          <Alert>
            <AlertDescription>{previewError ?? 'Ajuste os campos para ver o resultado.'}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
