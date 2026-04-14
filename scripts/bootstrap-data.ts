/**
 * Bootstrap inicial de cadastros para o Sistema de Análise de Lâminas.
 *
 * Roda MANUALMENTE, uma vez, após o primeiro usuário ser criado no Supabase
 * Auth. Idempotente: se já existem cadastros ativos para o user, aborta.
 *
 * Uso:
 *   1. Garantir `.env.local` com NEXT_PUBLIC_SUPABASE_URL,
 *      SUPABASE_SERVICE_ROLE_KEY e BOOTSTRAP_USER_EMAIL preenchidos.
 *   2. `pnpm tsx scripts/bootstrap-data.ts`
 *
 * Dados inseridos (PRD seção 9):
 *   - 3 minérios (Serra, Trindade, Corumbá)
 *   - 3 fundentes (Calcário Sandra, Bauxita Sto Expedito, Dolomita)
 *   - 2 insumos (Coque, Carvão vegetal)
 *   - 1 cliente (Gusa Aciaria)
 *   - 1 parâmetro do forno (defaults do schema)
 *
 * Usa service_role (bypass RLS) porque roda fora de sessão de usuário.
 * Todos os inserts setam `user_id` explicitamente — validado por Zod.
 */

import { createClient } from '@supabase/supabase-js';
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

import type { Database } from '../lib/supabase/types';

loadEnv({ path: '.env.local' });

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),
  BOOTSTRAP_USER_EMAIL: z.string().email(),
});

const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  BOOTSTRAP_USER_EMAIL: process.env.BOOTSTRAP_USER_EMAIL,
});

const admin = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

async function findUserId(email: string): Promise<string> {
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) throw new Error(`listUsers falhou: ${error.message}`);
  const user = data.users.find((u) => u.email === email);
  if (!user) throw new Error(`Usuário ${email} não encontrado em auth.users.`);
  return user.id;
}

async function alreadyBootstrapped(userId: string): Promise<boolean> {
  const { count, error } = await admin
    .from('minerios')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('valid_to', null);
  if (error) throw new Error(`check minerios falhou: ${error.message}`);
  return (count ?? 0) > 0;
}

const insertSchema = z.object({ user_id: z.string().uuid() });

async function main() {
  const userId = await findUserId(env.BOOTSTRAP_USER_EMAIL);
  console.log(`Target user: ${env.BOOTSTRAP_USER_EMAIL} (${userId})`);

  if (await alreadyBootstrapped(userId)) {
    console.log(
      'Cadastros ativos já existem para este usuário. Abortando (idempotência).',
    );
    process.exit(0);
  }

  // Sanity: cada payload tem user_id preenchido
  const withUser = <T extends Record<string, unknown>>(row: T) => {
    const payload = { ...row, user_id: userId };
    insertSchema.parse(payload);
    return payload;
  };

  const minerios = [
    withUser({
      nome: 'Serra da Moeda',
      preco_ton: 245.0,
      fe_pct: 62.0,
      sio2_pct: 5.5,
      al2o3_pct: 2.8,
      p_pct: 0.055,
      mn_pct: 0.15,
      cao_pct: 0.1,
      mgo_pct: 0.08,
      ppc_pct: 0,
      pis_credito_ton: 19.83,
      icms_credito_ton: 30.6,
      analise_validada: false,
    }),
    withUser({
      nome: 'Trindade',
      preco_ton: 390.0,
      fe_pct: 64.0,
      sio2_pct: 3.2,
      al2o3_pct: 2.3,
      p_pct: 0.06,
      mn_pct: 0.12,
      cao_pct: 0.15,
      mgo_pct: 0.05,
      ppc_pct: 0,
      pis_credito_ton: 36.08,
      icms_credito_ton: 0,
      analise_validada: false,
    }),
    withUser({
      nome: 'LHG Corumbá',
      preco_ton: 579.37,
      fe_pct: 63.5,
      sio2_pct: 4.8,
      al2o3_pct: 2.5,
      p_pct: 0.065,
      mn_pct: 0.18,
      cao_pct: 0.12,
      mgo_pct: 0.1,
      ppc_pct: 0,
      pis_credito_ton: 47.16,
      icms_credito_ton: 69.52,
      analise_validada: false,
    }),
  ];

  const insumos = [
    withUser({
      nome: 'Calcário Sandra',
      tipo: 'calcario',
      preco_unit: 94.0,
      unidade: 'ton',
      sio2_pct: 2.0,
      al2o3_pct: 0.5,
      cao_pct: 52.0,
      mgo_pct: 2.0,
      pis_credito: 8.7,
      icms_credito: 0,
    }),
    withUser({
      nome: 'Bauxita Sto Expedito',
      tipo: 'bauxita',
      preco_unit: 508.0,
      unidade: 'ton',
      sio2_pct: 6.0,
      al2o3_pct: 55.0,
      cao_pct: 0.5,
      mgo_pct: 0.3,
      pis_credito: 41.35,
      icms_credito: 60.96,
    }),
    withUser({
      nome: 'Dolomita',
      tipo: 'dolomita',
      preco_unit: 120.0,
      unidade: 'ton',
      sio2_pct: 1.5,
      al2o3_pct: 0.3,
      cao_pct: 30.0,
      mgo_pct: 21.0,
      pis_credito: 0,
      icms_credito: 0,
    }),
    withUser({
      nome: 'Coque metalúrgico',
      tipo: 'coque',
      preco_unit: 1408.0,
      unidade: 'ton',
      c_fixo_pct: 87.0,
      pis_credito: 143.52,
      icms_credito: 340.58,
    }),
    withUser({
      nome: 'Carvão vegetal',
      tipo: 'carvao',
      preco_unit: 360.0,
      unidade: 'MDC',
      c_fixo_pct: 75.0,
      densidade_kg_m3: 220.0,
      pis_credito: 0,
      icms_credito: 0,
    }),
  ];

  const clientes = [
    withUser({
      nome: 'Gusa Aciaria',
      cnpj: null,
      p_max: 0.15,
      si_max: 1.0,
      mn_max: 1.0,
      s_max: 0.05,
      c_min: 3.5,
      c_max: 4.5,
      preco_gusa_ton: 2690.66,
    }),
  ];

  const parametros = [withUser({})]; // todos defaults do schema

  const minRes = await admin.from('minerios').insert(minerios).select('id');
  if (minRes.error) throw minRes.error;

  const insRes = await admin.from('insumos').insert(insumos).select('id');
  if (insRes.error) throw insRes.error;

  const cliRes = await admin.from('clientes').insert(clientes).select('id');
  if (cliRes.error) throw cliRes.error;

  const parRes = await admin
    .from('parametros_forno')
    .insert(parametros)
    .select('id');
  if (parRes.error) throw parRes.error;

  console.log('Inseridos:');
  console.log(`  minérios: ${minRes.data?.length ?? 0}`);
  console.log(`  insumos:  ${insRes.data?.length ?? 0}`);
  console.log(`  clientes: ${cliRes.data?.length ?? 0}`);
  console.log(`  parâmetros: ${parRes.data?.length ?? 0}`);
  console.log('Bootstrap concluído.');
}

main().catch((err) => {
  console.error('Bootstrap falhou:', err);
  process.exit(1);
});
