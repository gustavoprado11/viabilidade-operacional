import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, it, expect } from 'vitest';

const CALC_DIR = join(process.cwd(), 'lib', 'calculation');

const FORBIDDEN_PATTERNS: ReadonlyArray<{ regex: RegExp; label: string }> = [
  { regex: /from\s+['"]react['"]/, label: 'react' },
  { regex: /from\s+['"]react\//, label: 'react/*' },
  { regex: /from\s+['"]react-dom/, label: 'react-dom' },
  { regex: /from\s+['"]next['"]/, label: 'next' },
  { regex: /from\s+['"]next\//, label: 'next/*' },
  { regex: /from\s+['"]server-only['"]/, label: 'server-only' },
  { regex: /from\s+['"]client-only['"]/, label: 'client-only' },
  { regex: /from\s+['"]@supabase\//, label: '@supabase/*' },
  { regex: /from\s+['"]@\/lib\/supabase\//, label: '@/lib/supabase/*' },
  { regex: /from\s+['"]fs['"]/, label: 'fs' },
  { regex: /from\s+['"]node:fs['"]/, label: 'node:fs' },
  { regex: /from\s+['"]path['"]/, label: 'path' },
  { regex: /from\s+['"]node:path['"]/, label: 'node:path' },
];

function collectTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectTsFiles(full));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      out.push(full);
    }
  }
  return out;
}

describe('lib/calculation purity contract', () => {
  const files = collectTsFiles(CALC_DIR);

  it('discovered at least the core modules', () => {
    expect(files.length).toBeGreaterThanOrEqual(8);
  });

  for (const file of files) {
    it(`${file.replace(CALC_DIR, 'lib/calculation')} has no forbidden imports`, () => {
      const src = readFileSync(file, 'utf8');
      const hits = FORBIDDEN_PATTERNS.filter((p) => p.regex.test(src)).map(
        (p) => p.label,
      );
      expect(hits, `forbidden imports: ${hits.join(', ')}`).toEqual([]);
    });
  }

  for (const file of files) {
    it(`${file.replace(CALC_DIR, 'lib/calculation')} has no async/Promise/I/O side effects`, () => {
      const src = readFileSync(file, 'utf8');
      expect(/\basync\s+function\b/.test(src)).toBe(false);
      expect(/\bawait\s+/.test(src)).toBe(false);
      expect(/\bconsole\.(log|warn|error|info|debug)\b/.test(src)).toBe(false);
      expect(/\bDate\.now\s*\(/.test(src)).toBe(false);
      expect(/\bMath\.random\s*\(/.test(src)).toBe(false);
      expect(/new\s+Date\s*\(\s*\)/.test(src)).toBe(false);
    });
  }
});
