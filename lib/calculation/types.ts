export type Estabilidade = 'estavel' | 'atencao' | 'instavel';
export type SucataDestino = 'venda' | 'reprocesso';
export type Classificacao = 'viavel' | 'alerta' | 'inviavel';

export type MinerioInput = Readonly<{
  id: string;
  nome: string;
  preco: number;
  fe: number;
  sio2: number;
  al2o3: number;
  p: number;
  mn: number;
  cao: number;
  mgo: number;
  ppc: number;
  pisCredito: number;
  icmsCredito: number;
}>;

export type FundenteInput = Readonly<{
  nome: string;
  preco: number;
  fe?: number;
  sio2: number;
  al2o3: number;
  cao: number;
  mgo: number;
  pisCredito?: number;
  icmsCredito?: number;
}>;

export type ClienteSpec = Readonly<{
  pMax: number;
  siMax: number;
  mnMax: number;
  sMax: number;
  cMin: number;
  cMax: number;
  precoGusa: number;
}>;

export type ParametrosForno = Readonly<{
  consumoMinerioDia: number;
  corridasPorDia: number;

  b2Min: number;
  b2Max: number;
  b2Alvo: number;
  al2o3EscoriaAlvoMin: number;
  al2o3EscoriaAlvoMax: number;
  al2o3EscoriaLimite: number;
  mgoAl2o3Min: number;

  rendFeRef1: number;
  rendRef1: number;
  rendFeRef2: number;
  rendRef2: number;

  fatorEstavel: number;
  fatorAtencao: number;
  fatorInstavel: number;

  particaoPGusa: number;
  particaoMnGusa: number;
  siIntercept: number;
  siCoefB2: number;
  sGusaFixo: number;
  cGusaFixo: number;

  custoFixoDia: number;
  freteGusaTon: number;

  debPisTon: number;
  debIcmsTon: number;
  debIpiTon: number;

  desvioToleranciaPct: number;
  desvioAtencaoPct: number;
}>;

export type Quebras = Readonly<{
  minerio: number;
  carvao: number;
  coque: number;
  fundentes: number;
}>;

export type BlendItem = Readonly<{ minerio: MinerioInput; pct: number }>;

export type LaminaInput = Readonly<{
  blend: ReadonlyArray<BlendItem>;
  carvao: Readonly<{ mdc: number; densidade: number; preco: number; pisCredito?: number; icmsCredito?: number }>;
  coque: Readonly<{ kg: number; preco: number; pisCredito?: number; icmsCredito?: number }>;
  fundentes: Readonly<{
    calcario: Readonly<{ kg: number; dados: FundenteInput }>;
    bauxita: Readonly<{ kg: number; dados: FundenteInput }>;
    dolomita: Readonly<{ kg: number; dados: FundenteInput }>;
  }>;
  quebras: Quebras;
  estabilidade: Estabilidade;
  sucata: Readonly<{ kg: number; precoTon: number; destino: SucataDestino }>;
  cliente: ClienteSpec;
  parametros: ParametrosForno;
}>;

export type BlendQuimica = Readonly<{
  fe: number;
  sio2: number;
  al2o3: number;
  p: number;
  mn: number;
  cao: number;
  mgo: number;
  ppc: number;
  precoMedio: number;
}>;

export type ProducaoResult = Readonly<{
  rendimentoTeorico: number;
  fatorEstabilidade: number;
  rendimentoEfetivo: number;
  consumoMinerioCorrida: number;
  gusaVazado: number;
  sucataGerada: number;
  producaoTotal: number;
}>;

export type EscoriaResult = Readonly<{
  sio2Ton: number;
  al2o3Ton: number;
  caoTon: number;
  mgoTon: number;
  volumeTon: number;
  volumePorTonGusa: number;
  b2: number;
  b4: number;
  al2o3Pct: number;
  mgoAl2o3: number;
  calcarioNecessario: number;
}>;

export type ContaminantesGusa = Readonly<{
  p: number;
  si: number;
  mn: number;
  s: number;
  c: number;
}>;

export type FinanceiroResult = Readonly<{
  custoMaterias: number;
  custoQuebras: number;
  custoFixo: number;
  custoFrete: number;
  custoTotal: number;
  custoPorTonGusa: number;
  receitaGusa: number;
  receitaSucata: number;
  creditoFuturoReprocesso: number;
  faturamentoTotal: number;
  debitoTributos: number;
  creditoTributos: number;
  tributosLiquidos: number;
  margemPorTon: number;
  resultadoCorrida: number;
  resultadoProjetadoMes: number;
}>;

export type ValidacaoResult = Readonly<{
  specCliente: Readonly<{ p: boolean; si: boolean; mn: boolean; s: boolean; c: boolean }>;
  escoria: Readonly<{ al2o3OK: boolean; mgoAl2o3OK: boolean; b2OK: boolean }>;
  classificacao: Classificacao;
  alertas: ReadonlyArray<string>;
  erros: ReadonlyArray<string>;
}>;

export type LaminaResultado = Readonly<{
  blend: BlendQuimica;
  producao: ProducaoResult;
  escoria: EscoriaResult;
  gusa: ContaminantesGusa;
  financeiro: FinanceiroResult;
  validacao: ValidacaoResult;
}>;

export type OtimizacaoRestricoes = Readonly<{
  feMin?: number;
  feMax?: number;
  al2o3EscoriaMax?: number;
  custoTonMax?: number;
}>;
