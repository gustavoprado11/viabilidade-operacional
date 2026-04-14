/**
 * Geração de CSV para o comparativo. Puro — sem deps.
 *
 * Formato:
 *   - Separador: vírgula
 *   - Encoding: UTF-8 com BOM (para Excel abrir sem bagunçar acentos)
 *   - Numéricos: ponto decimal (compatível com Excel em qualquer locale)
 *   - Campos com vírgula/aspas/newline: envoltos em aspas duplas, aspas internas duplicadas
 */

export type CsvCell = string | number | null | undefined;
export type CsvRow = ReadonlyArray<CsvCell>;

const BOM = '\uFEFF';

function formatCell(v: CsvCell): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return '';
    return String(v);
  }
  const needsQuote = /[",\n\r]/.test(v);
  if (!needsQuote) return v;
  return `"${v.replace(/"/g, '""')}"`;
}

export function buildCsv(rows: ReadonlyArray<CsvRow>): string {
  const body = rows.map((r) => r.map(formatCell).join(',')).join('\n');
  return BOM + body;
}

/**
 * Nome de arquivo padronizado: `comparativo-laminas-YYYY-MM-DD-HHMM.csv`.
 * Recebe a data explicitamente para ser testável sem mocks.
 */
export function csvFilename(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `comparativo-laminas-${y}-${m}-${d}-${hh}${mm}.csv`;
}
