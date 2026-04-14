import { z } from 'zod';

const minerioSchema = z.object({
  id: z.string().min(1),
  nome: z.string().min(1),
  preco: z.number().nonnegative(),
  fe: z.number().min(0).max(100),
  sio2: z.number().min(0).max(100),
  al2o3: z.number().min(0).max(100),
  p: z.number().min(0).max(100),
  mn: z.number().min(0).max(100),
  cao: z.number().min(0).max(100),
  mgo: z.number().min(0).max(100),
  ppc: z.number().min(0).max(100),
  pisCredito: z.number().nonnegative(),
  icmsCredito: z.number().nonnegative(),
});

const fundenteSchema = z.object({
  nome: z.string().min(1),
  preco: z.number().nonnegative(),
  fe: z.number().min(0).max(100).optional(),
  sio2: z.number().min(0).max(100),
  al2o3: z.number().min(0).max(100),
  cao: z.number().min(0).max(100),
  mgo: z.number().min(0).max(100),
  pisCredito: z.number().nonnegative().optional(),
  icmsCredito: z.number().nonnegative().optional(),
});

const clienteSpecSchema = z.object({
  pMax: z.number().positive(),
  siMax: z.number().positive(),
  mnMax: z.number().positive(),
  sMax: z.number().positive(),
  cMin: z.number().positive(),
  cMax: z.number().positive(),
  precoGusa: z.number().positive(),
});

const parametrosSchema = z.object({
  consumoMinerioDia: z.number().positive(),
  corridasPorDia: z.number().int().positive(),
  b2Min: z.number().positive(),
  b2Max: z.number().positive(),
  b2Alvo: z.number().positive(),
  al2o3EscoriaAlvoMin: z.number().positive(),
  al2o3EscoriaAlvoMax: z.number().positive(),
  al2o3EscoriaLimite: z.number().positive(),
  mgoAl2o3Min: z.number().nonnegative(),
  rendFeRef1: z.number().positive(),
  rendRef1: z.number().positive(),
  rendFeRef2: z.number().positive(),
  rendRef2: z.number().positive(),
  fatorEstavel: z.number().positive(),
  fatorAtencao: z.number().positive(),
  fatorInstavel: z.number().positive(),
  particaoPGusa: z.number().min(0).max(1),
  particaoMnGusa: z.number().min(0).max(1),
  siIntercept: z.number(),
  siCoefB2: z.number(),
  sGusaFixo: z.number().nonnegative(),
  cGusaFixo: z.number().nonnegative(),
  custoFixoDia: z.number().nonnegative(),
  freteGusaTon: z.number().nonnegative(),
  debPisTon: z.number().nonnegative(),
  debIcmsTon: z.number().nonnegative(),
  debIpiTon: z.number().nonnegative(),
  desvioToleranciaPct: z.number().min(0).max(1),
  desvioAtencaoPct: z.number().min(0).max(1),
});

const quebrasSchema = z.object({
  minerio: z.number().min(0).max(1),
  carvao: z.number().min(0).max(1),
  coque: z.number().min(0).max(1),
  fundentes: z.number().min(0).max(1),
});

const blendItemSchema = z.object({
  minerio: minerioSchema,
  pct: z.number().min(0).max(100),
});

export const laminaInputSchema = z
  .object({
    blend: z.array(blendItemSchema).min(1),
    carvao: z.object({
      mdc: z.number().nonnegative(),
      densidade: z.number().positive(),
      preco: z.number().nonnegative(),
      pisCredito: z.number().nonnegative().optional(),
      icmsCredito: z.number().nonnegative().optional(),
    }),
    coque: z.object({
      kg: z.number().nonnegative(),
      preco: z.number().nonnegative(),
      pisCredito: z.number().nonnegative().optional(),
      icmsCredito: z.number().nonnegative().optional(),
    }),
    fundentes: z.object({
      calcario: z.object({ kg: z.number().nonnegative(), dados: fundenteSchema }),
      bauxita: z.object({ kg: z.number().nonnegative(), dados: fundenteSchema }),
      dolomita: z.object({ kg: z.number().nonnegative(), dados: fundenteSchema }),
    }),
    quebras: quebrasSchema,
    estabilidade: z.enum(['estavel', 'atencao', 'instavel']),
    sucata: z.object({
      kg: z.number().nonnegative(),
      precoTon: z.number().nonnegative(),
      destino: z.enum(['venda', 'reprocesso']),
    }),
    cliente: clienteSpecSchema,
    parametros: parametrosSchema,
  })
  .refine(
    (input) => {
      const soma = input.blend.reduce((acc, b) => acc + b.pct, 0);
      return Math.abs(soma - 100) < 0.01;
    },
    { message: 'A soma do blend deve ser 100%.', path: ['blend'] },
  );
