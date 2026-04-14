import type {
  ClienteSpec,
  ParametrosForno,
} from '@/lib/calculation/types';

export const parametros: ParametrosForno = {
  consumoMinerioDia: 225.5,
  corridasPorDia: 16,
  b2Min: 0.8,
  b2Max: 0.85,
  b2Alvo: 0.825,
  al2o3EscoriaAlvoMin: 12.0,
  al2o3EscoriaAlvoMax: 16.0,
  al2o3EscoriaLimite: 17.0,
  mgoAl2o3Min: 0.25,
  rendFeRef1: 63.33,
  rendRef1: 0.6235,
  rendFeRef2: 62.6,
  rendRef2: 0.5926,
  fatorEstavel: 1.0,
  fatorAtencao: 0.95,
  fatorInstavel: 0.88,
  particaoPGusa: 0.95,
  particaoMnGusa: 0.65,
  siIntercept: 1.5,
  siCoefB2: -1.2,
  sGusaFixo: 0.025,
  cGusaFixo: 4.2,
  custoFixoDia: 27167,
  freteGusaTon: 50.75,
  debPisTon: 212.13,
  debIcmsTon: 312.72,
  debIpiTon: 84.69,
};

export const clienteGusaAciaria: ClienteSpec = {
  pMax: 0.15,
  siMax: 1.0,
  mnMax: 1.0,
  sMax: 0.05,
  cMin: 3.5,
  cMax: 4.5,
  precoGusa: 2690.66,
};
