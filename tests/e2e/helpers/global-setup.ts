import { spawnSync } from 'node:child_process';

/**
 * Roda o bootstrap do usuário E2E antes da suíte. Idempotente — se os
 * cadastros já existirem, o script apenas aborta sem erro.
 */
export default async function globalSetup(): Promise<void> {
  const result = spawnSync('pnpm', ['tsx', 'scripts/bootstrap-e2e-user.ts'], {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0 && result.status !== null) {
    throw new Error(`Bootstrap E2E falhou (status ${result.status})`);
  }
}
