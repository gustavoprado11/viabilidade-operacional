import { expect, test } from '@playwright/test';

const email = process.env.E2E_TEST_EMAIL;
const password = process.env.E2E_TEST_PASSWORD;
const canRun = email && password;

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email!);
  await page.getByLabel('Senha').fill(password!);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('http://localhost:3000/', { timeout: 15_000 });
}

(canRun ? test : test.skip)(
  'criar simulação → preview atualiza → salvar → aparece em /laminas',
  async ({ page }) => {
    await login(page);
    await page.goto('/laminas/nova');

    const nome = `Sim_${Date.now()}`;
    await page.getByLabel('Nome').fill(nome);

    // Preview deve renderizar cards de resultado (soma default 100%)
    await expect(page.getByTestId('card-producao')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('card-escoria')).toBeVisible();
    await expect(page.getByTestId('card-gusa')).toBeVisible();
    await expect(page.getByTestId('card-financeiro')).toBeVisible();

    // Salva — aguarda redirect ou mostra erro
    await page.getByTestId('submit').click();
    await Promise.race([
      page.waitForURL(/\/laminas\/[0-9a-f-]+$/, { timeout: 15_000 }),
      page.getByTestId('form-error').waitFor({ timeout: 15_000 }).then(async () => {
        const msg = await page.getByTestId('form-error').innerText();
        throw new Error(`Form error: ${msg}`);
      }),
    ]);

    // Na listagem aparece
    await page.goto('/laminas');
    await expect(page.getByTestId(`lamina-row-${nome}`)).toBeVisible();
  },
);

(canRun ? test : test.skip)(
  'blend inválido (soma ≠ 100) desabilita submit',
  async ({ page }) => {
    await login(page);
    await page.goto('/laminas/nova');
    // Força pct do 1º item para algo que quebra a soma
    const first = page.getByLabel('pct 0');
    await first.fill('42');
    await expect(page.getByTestId('blend-error')).toBeVisible();
    await expect(page.getByTestId('submit')).toBeDisabled();
  },
);

(canRun ? test : test.skip)(
  'corrida real exige timestamp',
  async ({ page }) => {
    await login(page);
    await page.goto('/laminas/nova');
    await page.getByLabel('Corrida real').check();
    await expect(page.getByLabel('Data/hora da corrida')).toBeVisible();
  },
);
