import type {
  ClienteSpec,
  FundenteInput,
  LaminaInput,
  MinerioInput,
  ParametrosForno,
  Quebras,
  SucataDestino,
  Estabilidade,
} from '@/lib/calculation/types';
import type { Database } from '@/lib/supabase/types';

type MinerioRow = Database['public']['Tables']['minerios']['Row'];
type InsumoRow = Database['public']['Tables']['insumos']['Row'];
type ClienteRow = Database['public']['Tables']['clientes']['Row'];
type ParamRow = Database['public']['Tables']['parametros_forno']['Row'];

export function minerioRowToInput(r: MinerioRow): MinerioInput {
  return {
    id: r.id,
    nome: r.nome,
    preco: Number(r.preco_ton),
    fe: Number(r.fe_pct),
    sio2: Number(r.sio2_pct),
    al2o3: Number(r.al2o3_pct),
    p: Number(r.p_pct),
    mn: Number(r.mn_pct),
    cao: Number(r.cao_pct),
    mgo: Number(r.mgo_pct),
    ppc: Number(r.ppc_pct),
    pisCredito: Number(r.pis_credito_ton),
    icmsCredito: Number(r.icms_credito_ton),
  };
}

export function fundenteRowToInput(r: InsumoRow): FundenteInput {
  return {
    nome: r.nome,
    preco: Number(r.preco_unit),
    sio2: Number(r.sio2_pct ?? 0),
    al2o3: Number(r.al2o3_pct ?? 0),
    cao: Number(r.cao_pct ?? 0),
    mgo: Number(r.mgo_pct ?? 0),
    pisCredito: r.pis_credito == null ? undefined : Number(r.pis_credito),
    icmsCredito: r.icms_credito == null ? undefined : Number(r.icms_credito),
  };
}

export function clienteRowToSpec(r: ClienteRow): ClienteSpec {
  return {
    pMax: Number(r.p_max),
    siMax: Number(r.si_max),
    mnMax: Number(r.mn_max),
    sMax: Number(r.s_max),
    cMin: Number(r.c_min),
    cMax: Number(r.c_max),
    precoGusa: Number(r.preco_gusa_ton),
  };
}

export function parametrosRowToInput(r: ParamRow): ParametrosForno {
  return {
    consumoMinerioDia: Number(r.consumo_minerio_dia),
    corridasPorDia: r.corridas_por_dia,
    b2Min: Number(r.b2_min),
    b2Max: Number(r.b2_max),
    b2Alvo: Number(r.b2_alvo),
    al2o3EscoriaAlvoMin: Number(r.al2o3_escoria_alvo_min),
    al2o3EscoriaAlvoMax: Number(r.al2o3_escoria_alvo_max),
    al2o3EscoriaLimite: Number(r.al2o3_escoria_limite),
    mgoAl2o3Min: Number(r.mgo_al2o3_min),
    rendFeRef1: Number(r.rend_fe_ref1),
    rendRef1: Number(r.rend_ref1),
    rendFeRef2: Number(r.rend_fe_ref2),
    rendRef2: Number(r.rend_ref2),
    fatorEstavel: Number(r.fator_estavel),
    fatorAtencao: Number(r.fator_atencao),
    fatorInstavel: Number(r.fator_instavel),
    particaoPGusa: Number(r.particao_p_gusa),
    particaoMnGusa: Number(r.particao_mn_gusa),
    siIntercept: Number(r.si_intercept),
    siCoefB2: Number(r.si_coef_b2),
    sGusaFixo: Number(r.s_gusa_fixo),
    cGusaFixo: Number(r.c_gusa_fixo),
    custoFixoDia: Number(r.custo_fixo_dia),
    freteGusaTon: Number(r.frete_gusa_ton),
    debPisTon: Number(r.deb_pis_ton),
    debIcmsTon: Number(r.deb_icms_ton),
    debIpiTon: Number(r.deb_ipi_ton),
  };
}

export type BlendPayload = Array<{ minerio_id: string; pct: number }>;

export type LaminaFormPayload = {
  nome: string;
  tipo: 'simulacao' | 'corrida_real';
  cliente_id: string;
  blend: BlendPayload;
  carvao_mdc: number;
  carvao_densidade: number;
  coque_kg: number;
  calcario_kg: number;
  bauxita_kg: number;
  dolomita_kg: number;
  quebras: Quebras;
  estabilidade: Estabilidade;
  sucata_kg: number;
  sucata_preco_ton: number;
  sucata_destino: SucataDestino;
  corrida_timestamp?: string | null;
  observacoes?: string | null;
  simulacao_origem_id?: string | null;
};

type CadastroBundle = {
  minerios: MinerioRow[];
  cliente: ClienteRow;
  calcario: InsumoRow;
  bauxita: InsumoRow;
  dolomita: InsumoRow;
  carvao: InsumoRow;
  coque: InsumoRow;
  parametros: ParamRow;
};

/**
 * Monta LaminaInput para o motor a partir do payload do form + cadastros.
 * Preços do carvão/coque vêm dos cadastros ativos; créditos são mapeados.
 */
export function buildLaminaInput(
  payload: LaminaFormPayload,
  b: CadastroBundle,
): LaminaInput {
  const blend = payload.blend.map((item) => {
    const row = b.minerios.find((m) => m.id === item.minerio_id);
    if (!row) throw new Error(`Minério ${item.minerio_id} não encontrado.`);
    return { minerio: minerioRowToInput(row), pct: item.pct };
  });

  return {
    blend,
    carvao: {
      mdc: payload.carvao_mdc,
      densidade: payload.carvao_densidade,
      preco: Number(b.carvao.preco_unit),
      pisCredito: b.carvao.pis_credito == null ? undefined : Number(b.carvao.pis_credito),
      icmsCredito: b.carvao.icms_credito == null ? undefined : Number(b.carvao.icms_credito),
    },
    coque: {
      kg: payload.coque_kg,
      preco: Number(b.coque.preco_unit),
      pisCredito: b.coque.pis_credito == null ? undefined : Number(b.coque.pis_credito),
      icmsCredito: b.coque.icms_credito == null ? undefined : Number(b.coque.icms_credito),
    },
    fundentes: {
      calcario: { kg: payload.calcario_kg, dados: fundenteRowToInput(b.calcario) },
      bauxita: { kg: payload.bauxita_kg, dados: fundenteRowToInput(b.bauxita) },
      dolomita: { kg: payload.dolomita_kg, dados: fundenteRowToInput(b.dolomita) },
    },
    quebras: payload.quebras,
    estabilidade: payload.estabilidade,
    sucata: {
      kg: payload.sucata_kg,
      precoTon: payload.sucata_preco_ton,
      destino: payload.sucata_destino,
    },
    cliente: clienteRowToSpec(b.cliente),
    parametros: parametrosRowToInput(b.parametros),
  };
}
