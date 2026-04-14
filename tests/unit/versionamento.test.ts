/**
 * Contrato do softUpdate/softDelete: valida ordem de chamadas ao Supabase
 * client via mock. Não bate no banco real.
 *
 * Ordem esperada no softUpdate:
 *   1) SELECT linha ativa
 *   2) INSERT nova versão (valid_to: null, valid_from: NOW)
 *   3) UPDATE antiga com valid_to = NOW
 *
 * Se o INSERT falhar, o UPDATE NÃO é chamado (preserva linha ativa).
 */

import { describe, it, expect, vi } from 'vitest';

import { softDelete, softUpdate } from '@/lib/queries/versioning';

type Call =
  | { op: 'select'; table: string }
  | { op: 'insert'; table: string; payload: unknown }
  | { op: 'update'; table: string; payload: unknown };

function makeMockClient(opts: {
  insertFails?: boolean;
  updateFails?: boolean;
  notFound?: boolean;
}) {
  const calls: Call[] = [];

  const mockFrom = (table: string) => {
    return {
      select: vi.fn(() => {
        calls.push({ op: 'select', table });
        return {
          eq: () => ({
            is: () => ({
              single: async () =>
                opts.notFound
                  ? { data: null, error: { message: 'not found' } }
                  : {
                      data: {
                        id: 'abc',
                        user_id: 'u1',
                        nome: 'Serra',
                        preco_ton: 245,
                        valid_from: '2024-01-01',
                        valid_to: null,
                        created_at: '2024-01-01',
                      },
                      error: null,
                    },
            }),
          }),
        };
      }),
      insert: vi.fn((payload: unknown) => {
        calls.push({ op: 'insert', table, payload });
        return {
          select: () => ({
            single: async () =>
              opts.insertFails
                ? { data: null, error: { message: 'insert failed' } }
                : { data: { id: 'new-id' }, error: null },
          }),
        };
      }),
      update: vi.fn((payload: unknown) => {
        calls.push({ op: 'update', table, payload });
        return {
          eq: () => ({
            is: async () =>
              opts.updateFails
                ? { error: { message: 'update failed' } }
                : { error: null },
          }),
        };
      }),
    };
  };

  const client = { from: mockFrom } as unknown as Parameters<typeof softUpdate>[0];
  return { client, calls };
}

describe('softUpdate', () => {
  it('fluxo ok: SELECT → INSERT → UPDATE, retorna {oldId, newId}', async () => {
    const { client, calls } = makeMockClient({});
    const result = await softUpdate(client, 'minerios', 'abc', {
      preco_ton: 300,
    });
    expect(result).toEqual({ oldId: 'abc', newId: 'new-id' });
    expect(calls.map((c) => c.op)).toEqual(['select', 'insert', 'update']);
    // Payload do insert tem valid_to=null e valid_from definido
    const insertCall = calls.find((c) => c.op === 'insert')!;
    const payload = (insertCall as Extract<Call, { op: 'insert' }>).payload as Record<string, unknown>;
    expect(payload.valid_to).toBeNull();
    expect(payload.valid_from).toBeTypeOf('string');
    expect(payload.preco_ton).toBe(300); // patch aplicado
    expect(payload.nome).toBe('Serra'); // merge do atual
    expect(payload.id).toBeUndefined(); // id removido (Postgres gera novo)
  });

  it('registro não encontrado: lança sem chamar INSERT ou UPDATE', async () => {
    const { client, calls } = makeMockClient({ notFound: true });
    await expect(
      softUpdate(client, 'minerios', 'missing', {}),
    ).rejects.toThrow(/não encontrado/);
    expect(calls.find((c) => c.op === 'insert')).toBeUndefined();
    expect(calls.find((c) => c.op === 'update')).toBeUndefined();
  });

  it('INSERT falha: não chama UPDATE (preserva linha ativa antiga)', async () => {
    const { client, calls } = makeMockClient({ insertFails: true });
    await expect(
      softUpdate(client, 'minerios', 'abc', { preco_ton: 300 }),
    ).rejects.toThrow(/falha ao inserir/);
    expect(calls.find((c) => c.op === 'update')).toBeUndefined();
  });

  it('UPDATE da antiga falha: lança (reconciliação manual necessária)', async () => {
    const { client } = makeMockClient({ updateFails: true });
    await expect(
      softUpdate(client, 'minerios', 'abc', { preco_ton: 300 }),
    ).rejects.toThrow(/Ação manual/);
  });
});

describe('softDelete', () => {
  it('chama UPDATE com valid_to definido', async () => {
    const { client, calls } = makeMockClient({});
    await softDelete(client, 'minerios', 'abc');
    expect(calls[0]?.op).toBe('update');
    const payload = (calls[0] as Extract<Call, { op: 'update' }>).payload as Record<string, unknown>;
    expect(payload.valid_to).toBeTypeOf('string');
  });

  it('propaga erro do supabase', async () => {
    const { client } = makeMockClient({ updateFails: true });
    await expect(softDelete(client, 'minerios', 'abc')).rejects.toThrow(
      /update failed/,
    );
  });
});
