import { router } from '@inertiajs/react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ExpenseIndex from '@/pages/expenses/index';
import { defaultExpenseQuery, type Expense, type ExpenseListResponse } from '@/types/expense';

vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@inertiajs/react')>();

    return { ...actual, Head: () => null };
});

const expense: Expense = {
    id: 12,
    title: 'Team lunch',
    amount: '1250.00',
    category: 'Food',
    expense_date: '2026-09-24',
    notes: 'Planning session',
    created_at: '2026-09-24T08:00:00.000000Z',
    updated_at: '2026-09-24T08:00:00.000000Z',
};

function listResponse(expenses: Expense[], total = expenses.length): ExpenseListResponse {
    return {
        data: expenses,
        links: { first: null, last: null, prev: null, next: null },
        meta: {
            current_page: 1,
            from: expenses.length ? 1 : null,
            last_page: 1,
            per_page: 10,
            to: expenses.length || null,
            total,
        },
    };
}

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
});

describe('ExpenseIndex', () => {
    it('renders populated, empty, and filtered-empty states from Inertia props', () => {
        const { rerender } = render(
            <ExpenseIndex expenses={listResponse([expense])} filters={defaultExpenseQuery} categories={['Food']} />,
        );

        expect(screen.getAllByText('Team lunch').length).toBeGreaterThan(0);
        fireEvent.click(screen.getAllByRole('button', { name: 'View Team lunch' })[0]!);
        expect(screen.getByText('Planning session')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));

        rerender(<ExpenseIndex expenses={listResponse([])} filters={defaultExpenseQuery} categories={[]} />);
        expect(screen.getByRole('heading', { name: 'No expenses yet' })).toBeInTheDocument();

        rerender(
            <ExpenseIndex
                expenses={listResponse([])}
                filters={{ ...defaultExpenseQuery, category: 'Food' }}
                categories={['Food']}
            />,
        );
        expect(screen.getByRole('heading', { name: 'No matching expenses' })).toBeInTheDocument();
    });

    it('sends discrete filters as partial Inertia visits with history entries', () => {
        const get = vi.spyOn(router, 'get').mockImplementation(() => undefined);
        render(<ExpenseIndex expenses={listResponse([])} filters={defaultExpenseQuery} categories={['Food']} />);

        fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Food' } });

        expect(get).toHaveBeenCalledWith(
            '/',
            { category: 'Food' },
            expect.objectContaining({
                only: ['expenses', 'filters'],
                preserveScroll: true,
                preserveState: true,
                replace: false,
            }),
        );
    });

    it('debounces title search and replaces the current history entry', async () => {
        vi.useFakeTimers();
        const get = vi.spyOn(router, 'get').mockImplementation(() => undefined);
        render(<ExpenseIndex expenses={listResponse([])} filters={defaultExpenseQuery} categories={[]} />);

        fireEvent.change(screen.getByLabelText('Search title'), { target: { value: 'lunch' } });
        await act(async () => {
            await vi.advanceTimersByTimeAsync(299);
        });
        expect(get).not.toHaveBeenCalled();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(1);
        });

        expect(get).toHaveBeenCalledWith(
            '/',
            { search: 'lunch' },
            expect.objectContaining({ replace: true }),
        );
    });

    it('rejects an invalid date range before making an Inertia visit', () => {
        const get = vi.spyOn(router, 'get').mockImplementation(() => undefined);
        render(<ExpenseIndex expenses={listResponse([])} filters={defaultExpenseQuery} categories={[]} />);

        fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-09-25' } });
        fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2026-09-24' } });

        expect(screen.getByRole('alert')).toHaveTextContent('The start date must be on or before the end date.');
        expect(get).toHaveBeenCalledTimes(1);
        expect(get).not.toHaveBeenLastCalledWith('/', expect.objectContaining({ date_to: '2026-09-24' }), expect.anything());
    });

    it('clears filters by visiting the canonical root URL parameters', () => {
        const get = vi.spyOn(router, 'get').mockImplementation(() => undefined);
        render(
            <ExpenseIndex
                expenses={listResponse([])}
                filters={{ ...defaultExpenseQuery, category: 'Food', sort: 'title', direction: 'asc' }}
                categories={['Food']}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));

        expect(get).toHaveBeenLastCalledWith('/', {}, expect.objectContaining({ replace: false }));
    });

    it('deletes through Inertia and keeps the dialog open until success', () => {
        const remove = vi.spyOn(router, 'delete').mockImplementation((_url, options) => {
            options?.onSuccess?.({ flash: { success: 'Expense deleted.' } } as never);
            options?.onFinish?.({} as never);
        });
        render(<ExpenseIndex expenses={listResponse([expense])} filters={defaultExpenseQuery} categories={['Food']} />);

        fireEvent.click(screen.getAllByRole('button', { name: 'Delete Team lunch' })[0]!);
        fireEvent.click(screen.getByRole('button', { name: 'Delete expense' }));

        expect(remove).toHaveBeenCalledWith('/expenses/12', expect.objectContaining({ preserveScroll: true }));
        expect(screen.queryByRole('button', { name: 'Delete expense' })).not.toBeInTheDocument();
    });
});
