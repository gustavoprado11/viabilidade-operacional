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
import {
  CARGAS_PADRAO,
  PESO_POR_CARGA_PADRAO_KG,
  calcularMdc,
} from '@/lib/laminas/mdc-calc';
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
  const [carvaoDens, setCarvaoDens] = useState(
    initial?.carvao_densidade ?? Number(carvao.densidade_kg_m3 ?? 220),
  );
  const initialTemDetalhe =
    initial?.carvao_cargas_por_corrida != null &&
    initial?.carvao_peso_por_carga_kg != null;
  const [carvaoCargas, setCarvaoCargas] = useState<number>(
    initial?.carvao_cargas_por_corrida ?? CARGAS_PADRAO,
  );
  const [carvaoPesoCarga, setCarvaoPesoCarga] = useState<number>(
    initial?.carvao_peso_por_carga_kg ?? PESO_POR_CARGA_PADRAO_KG,
  );
  const mdcRaw = calcularMdc(carvaoCargas, carvaoPesoCarga, carvaoDens);
  const carvaoMdc = mdcRaw > 0 ? mdcRaw : (initial?.carvao_mdc ?? 0);
  const mostrarAvisoLegado =
    initial?.id != null && !initialTemDetalhe && (initial?.carvao_mdc ?? 0) > 0;
  const [coqueKg, setCoqueKg] = useState(initial?.coque_kg ?? 1280);
  const [calcarioKg, setCalcarioKg] = useState(initial?.calcario_kg ?? 0);
  const [calcarioManual, setCalcarioManual] = useState(
    initial?.calcario_manual ?? false,
  );
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
      carvao_cargas_por_corrida: Number(carvaoCargas),
      carvao_peso_por_carga_kg: Number(carvaoPesoCarga),
      coque_kg: Number(coqueKg),
      calcario_kg: Number(calcarioKg),
      calcario_manual: calcarioManual,
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
      nome, tipo, clienteId, blend, carvaoMdc, carvaoDens, carvaoCargas, carvaoPesoCarga, coqueKg, calcarioKg,
      calcarioManual, bauxitaKg, dolomitaKg, quebras, estabilidade, sucataKg,
      sucataPreco, sucataDestino, corridaTs, observacoes,
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
        {initial?.simulacao_origem_id ? (
          <input type="hidden" name="simulacao_origem_id" value={initial.simulacao_origem_id} />
        ) : null}

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
            <div className="space-y-2 sm:col-span-2 rounded-md border p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Carvão</span>
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                  💰 afeta custo
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="carvao_cargas_por_corrida" className="text-xs">
                    Cargas por corrida
                  </Label>
                  <Input
                    id="carvao_cargas_por_corrida"
                    name="carvao_cargas_por_corrida"
                    type="number"
                    step="0.01"
                    min="0"
                    value={carvaoCargas}
                    onChange={(e) => setCarvaoCargas(Number(e.target.value))}
                    data-testid="carvao-cargas"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="carvao_peso_por_carga_kg" className="text-xs">
                    Peso por carga (kg)
                  </Label>
                  <Input
                    id="carvao_peso_por_carga_kg"
                    name="carvao_peso_por_carga_kg"
                    type="number"
                    step="0.01"
                    min="0"
                    value={carvaoPesoCarga}
                    onChange={(e) => setCarvaoPesoCarga(Number(e.target.value))}
                    data-testid="carvao-peso-carga"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="carvao_densidade" className="text-xs">
                    Densidade (kg/m³)
                  </Label>
                  <Input
                    id="carvao_densidade"
                    name="carvao_densidade"
                    type="number"
                    step="0.01"
                    min="0"
                    value={carvaoDens}
                    onChange={(e) => setCarvaoDens(Number(e.target.value))}
                  />
                </div>
              </div>
              <div
                className="mt-1 flex items-baseline justify-between border-t pt-2 text-sm"
                data-testid="carvao-mdc-calculado"
              >
                <span className="text-muted-foreground">
                  MDC/corrida calculado
                </span>
                <span className="font-semibold tabular-nums">
                  {carvaoMdc.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              {mostrarAvisoLegado ? (
                <p className="text-xs text-amber-700">
                  Valor de MDC persistido sem detalhamento — preencha cargas e
                  peso para habilitar cálculo automático.
                </p>
              ) : null}
              {/* Enviado derivado; motor reconstrói o valor no server a partir
                  de cargas/peso/densidade, mas mantemos o campo para compat. */}
              <input
                type="hidden"
                name="carvao_mdc"
                value={Number.isFinite(carvaoMdc) ? carvaoMdc : 0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coque_kg" className="flex items-center gap-2">
                Coque (kg/corrida)
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                  💰 afeta custo
                </span>
              </Label>
              <Input
                id="coque_kg" name="coque_kg" type="number" step="0.01"
                value={coqueKg} onChange={(e) => setCoqueKg(Number(e.target.value))}
                title="Afeta custo operacional. Cinzas não entram no balanço da escória (simplificação do modelo)."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bauxita_kg">Bauxita (kg/corrida)</Label>
              <Input
                id="bauxita_kg" name="bauxita_kg" type="number" step="0.01"
                value={bauxitaKg} onChange={(e) => setBauxitaKg(Number(e.target.value))}
                title="Aumenta Al₂O₃ na escória. Usada para corrigir composição quando minério tem pouca alumina."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dolomita_kg">Dolomita (kg/corrida)</Label>
              <Input
                id="dolomita_kg" name="dolomita_kg" type="number" step="0.01"
                value={dolomitaKg} onChange={(e) => setDolomitaKg(Number(e.target.value))}
                title="Aumenta MgO na escória, melhorando fluidez. Corrige relação MgO/Al₂O₃."
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="calcario_kg">Calcário (kg/corrida)</Label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    name="calcario_manual"
                    checked={calcarioManual}
                    onChange={(e) => setCalcarioManual(e.target.checked)}
                    data-testid="calcario-manual-toggle"
                  />
                  <span>Modo manual</span>
                </label>
              </div>
              <input type="hidden" name="calcario_kg" value={calcarioKg} />
              <Input
                id="calcario_kg" type="number" step="0.01"
                value={calcarioKg}
                onChange={(e) => setCalcarioKg(Number(e.target.value))}
                disabled={!calcarioManual}
                title={
                  calcarioManual
                    ? 'Modo manual: valor digitado é usado diretamente no cálculo de escória.'
                    : 'Modo automático: recalculado a cada mudança para atingir B2 alvo.'
                }
              />
              <p className="text-xs text-muted-foreground">
                {calcarioManual
                  ? '⚠ Valor informado é usado literalmente. B2 pode divergir do alvo.'
                  : preview?.escoria.calcarioNecessario != null
                  ? `Calculado automaticamente para atingir B2 alvo: ${(preview.escoria.calcarioNecessario * 1000).toFixed(2)} kg.`
                  : 'Calculado automaticamente pelo motor para atingir B2 alvo.'}
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

        {/*
          TODO v1.1: PRD pediu botões distintos "Salvar simulação" e
          "Salvar como corrida real". Fluxo atual (radio "Tipo" acima +
          botão único) é funcional e validado por E2E. Adiar para v1.1
          junto com decisão de UX mais ampla.
        */}
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
              corridasPorDia={parametros.corridas_por_dia ?? 16}
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
