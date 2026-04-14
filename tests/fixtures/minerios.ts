import type { MinerioInput, FundenteInput } from '@/lib/calculation/types';

export const serra: MinerioInput = {
  id: 'serra',
  nome: 'Serra da Moeda',
  preco: 245,
  fe: 62.0,
  sio2: 5.5,
  al2o3: 2.8,
  p: 0.055,
  mn: 0.15,
  cao: 0.1,
  mgo: 0.08,
  ppc: 0,
  pisCredito: 19.83,
  icmsCredito: 30.6,
};

export const trindade: MinerioInput = {
  id: 'trindade',
  nome: 'Trindade',
  preco: 390,
  fe: 64.0,
  sio2: 3.2,
  al2o3: 2.3,
  p: 0.06,
  mn: 0.12,
  cao: 0.15,
  mgo: 0.05,
  ppc: 0,
  pisCredito: 36.08,
  icmsCredito: 0,
};

export const corumba: MinerioInput = {
  id: 'corumba',
  nome: 'LHG Corumbá',
  preco: 579.37,
  fe: 63.5,
  sio2: 4.8,
  al2o3: 2.5,
  p: 0.065,
  mn: 0.18,
  cao: 0.12,
  mgo: 0.1,
  ppc: 0,
  pisCredito: 47.16,
  icmsCredito: 69.52,
};

export const calcario: FundenteInput = {
  nome: 'Calcário Sandra',
  preco: 94,
  sio2: 2.0,
  al2o3: 0.5,
  cao: 52.0,
  mgo: 2.0,
  pisCredito: 8.7,
  icmsCredito: 0,
};

export const bauxita: FundenteInput = {
  nome: 'Bauxita Sto Expedito',
  preco: 508,
  sio2: 6.0,
  al2o3: 55.0,
  cao: 0.5,
  mgo: 0.3,
  pisCredito: 41.35,
  icmsCredito: 60.96,
};

export const dolomita: FundenteInput = {
  nome: 'Dolomita',
  preco: 120,
  sio2: 1.5,
  al2o3: 0.3,
  cao: 30.0,
  mgo: 21.0,
  pisCredito: 0,
  icmsCredito: 0,
};
