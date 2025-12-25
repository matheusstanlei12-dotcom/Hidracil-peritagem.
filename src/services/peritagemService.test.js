import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPeritagens, savePeritagem } from './peritagemService';
import { supabase } from './supabaseClient';

// Mock supabaseClient
vi.mock('./supabaseClient', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: [{ id: 1, cliente: 'Teste' }], error: null })),
                eq: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: { id: 1 }, error: null })),
                })),
                single: vi.fn(() => Promise.resolve({ data: { id: 1 }, error: null })),
            })),
            insert: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: { id: 1, cliente: 'Novo' }, error: null })),
                })),
            })),
            update: vi.fn(() => ({
                eq: vi.fn(() => ({
                    select: vi.fn(() => ({
                        single: vi.fn(() => Promise.resolve({ data: { id: 1 }, error: null })),
                    })),
                })),
            })),
            delete: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
        })),
        auth: {
            getSession: vi.fn(() => Promise.resolve({ data: { session: { user: { id: 'user-123' } } }, error: null })),
        }
    }
}));

describe('peritagemService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch peritagens correctly', async () => {
        const data = await getPeritagens();
        expect(data).toHaveLength(1);
        expect(data[0].cliente).toBe('Teste');
        expect(supabase.from).toHaveBeenCalledWith('peritagens');
    });

    it('should save a peritagem correctly', async () => {
        const mockNew = { cliente: 'Novo', equipamento: 'Bomba', orcamento: '123' };
        const data = await savePeritagem(mockNew);
        expect(data.cliente).toBe('Novo');
        expect(supabase.from).toHaveBeenCalledWith('peritagens');
    });
});
