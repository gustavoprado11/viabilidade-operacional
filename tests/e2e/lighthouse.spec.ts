/**
 * Lighthouse audits. Target: Performance ≥80, Accessibility ≥90.
 *
 * SETUP (não roda na suíte default — dev mode distorce métricas de perf):
 *   1. `pnpm build`
 *   2. `pnpm start &` (servidor prod local na :3000)
 *   3. `RUN_LIGHTHOUSE=1 pnpm exec playwright test tests/e2e/lighthouse.spec.ts --workers 1`
 *
 * Medição atual (abr/2026): perf=100 e a11y=100 em todas as 4 rotas.
 */

import { chromium } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

import { E2E_PASSWORD, E2E_READY, E2E_EMAIL } from './helpers/auth';

const TARGETS = {
  performance: 80,
  accessibility: 90,
};

const PATHS = ['/login', '/', '/laminas/nova', '/relatorios'];
const PORT = 9222;

(E2E_READY && process.env.RUN_LIGHTHOUSE === '1' ? test : test.skip)(
  'Lighthouse: /login, /, /laminas/nova, /relatorios atingem targets',
  async () => {
    test.setTimeout(180_000);

    const browser = await chromium.launch({
      args: [`--remote-debugging-port=${PORT}`],
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login
    await page.goto('http://localhost:3000/login');
    await page.getByLabel('E-mail').fill(E2E_EMAIL);
    await page.getByLabel('Senha').fill(E2E_PASSWORD);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL('http://localhost:3000/', { timeout: 15_000 });

    const scores: Array<{ path: string; perf: number; a11y: number }> = [];

    for (const path of PATHS) {
      await page.goto(`http://localhost:3000${path}`);
      await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});

      const result = await playAudit({
        page,
        port: PORT,
        thresholds: TARGETS,
        reports: { formats: { html: false, json: false } },
      }).catch((e: Error) => {
        throw new Error(`Lighthouse falhou em ${path}: ${e.message}`);
      });

      const categories = (result as unknown as {
        lhr: { categories: { performance: { score: number }; accessibility: { score: number } } };
      }).lhr.categories;
      scores.push({
        path,
        perf: Math.round((categories.performance.score ?? 0) * 100),
        a11y: Math.round((categories.accessibility.score ?? 0) * 100),
      });
    }

    console.log('\nLighthouse scores:');
    for (const s of scores) {
      console.log(`  ${s.path.padEnd(20)} perf=${s.perf} a11y=${s.a11y}`);
    }

    for (const s of scores) {
      expect(s.perf, `${s.path} perf`).toBeGreaterThanOrEqual(TARGETS.performance);
      expect(s.a11y, `${s.path} a11y`).toBeGreaterThanOrEqual(TARGETS.accessibility);
    }

    await browser.close();
  },
);
