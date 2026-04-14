import { config as loadEnv } from 'dotenv';

import { cleanupE2ESimulacoes } from './cleanup';

/**
 * Após a suíte E2E completar, soft-deleta simulações do usuário E2E.
 * Cadastros persistem entre runs (bootstrap é idempotente).
 */
export default async function globalTeardown(): Promise<void> {
  loadEnv({ path: '.env.local' });
  await cleanupE2ESimulacoes();
}
