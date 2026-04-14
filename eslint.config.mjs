import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    files: ['lib/calculation/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-*',
                'next',
                'next/*',
                'server-only',
                'client-only',
                '@supabase/*',
                '@/lib/supabase/*',
                'fs',
                'node:fs',
                'path',
                'node:path',
                'fs/promises',
                'node:fs/promises',
              ],
              message:
                'lib/calculation/** must be pure: no React, Next, Supabase, or Node I/O imports allowed.',
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
