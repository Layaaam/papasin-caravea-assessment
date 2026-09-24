import { afterEach, describe, expect, it, vi } from 'vitest';

import { ExpenseServiceError, expenseService, serializeExpenseQuery } from '@/services/expense-service';
import { defaultExpenseQuery } from '@/types/expense';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('expense service', () => {
    it('serializes server-side filters and pagination', () => {
        const parameters = new URLSearchParams(
            serializeExpenseQuery({
                ...defaultExpenseQuery,
                search: '  lunch  ',
                category: 'Food',
                date_from: '2026-09-01',
                date_to: '2026-09-24',
                sort: 'amount',
                direction: 'asc',
                page: 2,
                per_page: 25,
            }),
        );

        expect(Object.fromEntries(parameters)).toEqual({
            search: 'lunch',
            category: 'Food',
            date_from: '2026-09-01',
            date_to: '2026-09-24',
            sort: 'amount',
            direction: 'asc',
            page: '2',
            per_page: '25',
        });
    });

    it('returns the paginated API response with its category metadata', async () => {
        const payload = {
            data: [],
            links: { first: null, last: null, prev: null, next: null },
            meta: {
                current_page: 1,
                from: null,
                last_page: 1,
                per_page: 10,
                to: null,
                total: 0,
                categories: ['Food', 'Client Meals'],
            },
        };
        vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(JSON.stringify(payload), { status: 200 }))));

        await expect(expenseService.list(defaultExpenseQuery)).resolves.toEqual(payload);
    });

    it('normalizes Laravel validation errors', async () => {
        const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify({
            message: 'The given data was invalid.',
            errors: { title: ['The title field is required.'] },
        }), { status: 422, headers: { 'Content-Type': 'application/json' } })));
        vi.stubGlobal('fetch', fetchMock);

        await expect(expenseService.create({
            title: '',
            amount: '12.50',
            category: 'Food',
            expense_date: '2026-09-24',
            notes: null,
        })).rejects.toMatchObject({
            status: 422,
            errors: { title: ['The title field is required.'] },
        });
        expect(fetchMock).toHaveBeenCalledWith('/api/v1/expenses', expect.objectContaining({ method: 'POST' }));
    });

    it('normalizes network failures without exposing implementation details', async () => {
        vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))));

        await expect(expenseService.list(defaultExpenseQuery)).rejects.toEqual(
            new ExpenseServiceError('Unable to reach the server. Please try again.', null),
        );
    });

    it('accepts a successful no-content deletion', async () => {
        vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(null, { status: 204 }))));

        await expect(expenseService.remove(12)).resolves.toBeUndefined();
    });
});
