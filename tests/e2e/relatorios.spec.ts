import { expect, test } from '@playwright/test';

import { E2E_READY, loginE2E } from './helpers/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;


(E2E_READY ? test : test.skip)(
  'abre /relatorios com filtros default e renderiza dashboard',
  async ({ page }) => {
    await loginE2E(page);
    await page.goto('/relatorios');
    // Header visível
    await expect(page.getByRole('heading', { name: 'Relatórios' })).toBeVisible();
    // Botões de export aparecem
    await expect(page.getByTestId('export-csv')).toBeVisible();
    await expect(page.getByTestId('export-xlsx')).toBeVisible();
    await expect(page.getByTestId('export-pdf')).toBeVisible();
  },
);

(E2E_READY ? test : test.skip)(
  'export CSV baixa arquivo válido',
  async ({ page }) => {
    await loginE2E(page);
    await page.goto('/relatorios');

    const hasData = await page.getByTestId('export-csv').isEnabled();
    if (!hasData) test.skip();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-csv').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^relatorio-\d{4}-\d{2}-\d{2}-\d{4}\.csv$/);
  },
);

(E2E_READY ? test : test.skip)(
  'export Excel dispara download do endpoint /api/export',
  async ({ page, request }) => {
    await loginE2E(page);
    await page.goto('/relatorios');

    // Pega o href do link de Excel e bate direto via request (já autenticado via cookies da page)
    const href = await page.getByTestId('export-xlsx').getAttribute('href');
    expect(href).toMatch(/^\/api\/export\?formato=xlsx/);

    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    const res = await request.get(`http://localhost:3000${href!}`, {
      headers: { cookie: cookieHeader },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('spreadsheetml');
    const body = await res.body();
    expect(body.length).toBeGreaterThan(1000);
  },
);

(E2E_READY ? test : test.skip)(
  'export PDF dispara download do endpoint /api/export',
  async ({ page, request }) => {
    await loginE2E(page);
    await page.goto('/relatorios');

    const href = await page.getByTestId('export-pdf').getAttribute('href');
    expect(href).toMatch(/^\/api\/export\?formato=pdf/);

    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    const res = await request.get(`http://localhost:3000${href!}`, {
      headers: { cookie: cookieHeader },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toBe('application/pdf');
    const body = await res.body();
    // PDFs começam com %PDF-
    expect(body.slice(0, 5).toString('utf-8')).toBe('%PDF-');
  },
);