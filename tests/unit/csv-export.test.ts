import { describe, it, expect } from 'vitest';

import { buildCsv, csvFilename } from '@/lib/comparativo/csv';

describe('buildCsv', () => {
  it('inicia com BOM (UTF-8)', () => {
    const csv = buildCsv([['a', 'b']]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it('separa células por vírgula, linhas por \\n', () => {
    const csv = buildCsv([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
    expect(csv.slice(1)).toBe('a,b,c\n1,2,3');
  });

  it('formata número com ponto decimal (não locale)', () => {
    const csv = buildCsv([[1234.56]]);
    expect(csv.slice(1)).toBe('1234.56');
  });

  it('null e undefined viram string vazia', () => {
    const csv = buildCsv([[null, undefined, 'x']]);
    expect(csv.slice(1)).toBe(',,x');
  });

  it('cerca com aspas quando há vírgula, aspa ou newline', () => {
    const csv = buildCsv([['a,b', 'c"d', 'e\nf']]);
    expect(csv.slice(1)).toBe('"a,b","c""d","e\nf"');
  });

  it('acentos preservados', () => {
    const csv = buildCsv([['Calcário', 'Bauxita Sto Expedito']]);
    expect(csv.slice(1)).toContain('Calcário');
  });

  it('NaN e Infinity viram vazio', () => {
    const csv = buildCsv([[NaN, Infinity, -Infinity]]);
    expect(csv.slice(1)).toBe(',,');
  });
});

describe('csvFilename', () => {
  it('formata YYYY-MM-DD-HHMM', () => {
    const d = new Date(2026, 3, 14, 9, 5); // abril(3) 14, 09:05
    expect(csvFilename(d)).toBe('comparativo-laminas-2026-04-14-0905.csv');
  });

  it('pad com zero', () => {
    const d = new Date(2026, 0, 1, 0, 0);
    expect(csvFilename(d)).toBe('comparativo-laminas-2026-01-01-0000.csv');
  });
});
