import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ExpensePage } from '@/pages/expense-page';
import { ExpenseServiceError, expenseService } from '@/services/expense-service';
import type { Expense, ExpenseListResponse } from '@/types/expense';

vi.mock('@/components/ui/sonner', () => ({ Toaster: () => null }));

const expense: Expense = {
    id: 7,
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
            categories: ['Food', 'Client Meals'],
        },
    };
}

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
});

describe('ExpensePage', () => {
    it('shows loading and then the unfiltered empty state', async () => {
        let finishLoading: ((value: ExpenseListResponse) => void) | undefined;
        vi.spyOn(expenseService, 'list').mockImplementation(() => new Promise((resolve) => { finishLoading = resolve; }));

        render(<ExpensePage />);

        expect(screen.getByLabelText('Loading expenses')).toHaveAttribute('aria-busy', 'true');
        await act(async () => {
            finishLoading?.(listResponse([]));
            await Promise.resolve();
        });
        expect(screen.getByRole('heading', { name: 'No expenses yet' })).toBeInTheDocument();
    });

    it('renders a populated list and a distinct no-results state after filtering', async () => {
        vi.spyOn(expenseService, 'list')
            .mockResolvedValueOnce(listResponse([expense]))
            .mockResolvedValueOnce(listResponse([]));

        render(<ExpensePage />);

        expect((await screen.findAllByText('Team lunch')).length).toBeGreaterThan(0);
        expect(screen.getAllByText('₱1,250.00').length).toBeGreaterThan(0);

        fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Shopping' } });

        expect(await screen.findByRole('heading', { name: 'No matching expenses' })).toBeInTheDocument();
    });

    it('preserves filters and a retry action when the list request fails', async () => {
        const list = vi.spyOn(expenseService, 'list')
            .mockRejectedValueOnce(new ExpenseServiceError('Server unavailable.', 500))
            .mockResolvedValueOnce(listResponse([]));

        render(<ExpensePage />);

        expect(await screen.findByRole('alert')).toHaveTextContent('Server unavailable.');
        expect(screen.getByLabelText('Category')).toBeEnabled();
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
        expect(await screen.findByRole('heading', { name: 'No expenses yet' })).toBeInTheDocument();
    });

    it('rejects an invalid date range before requesting another page', async () => {
        const list = vi.spyOn(expenseService, 'list').mockResolvedValue(listResponse([]));
        render(<ExpensePage />);
        await screen.findByRole('heading', { name: 'No expenses yet' });

        fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-09-25' } });
        fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2026-09-24' } });

        expect(screen.getByRole('alert')).toHaveTextContent('The start date must be on or before the end date.');
        expect(list).not.toHaveBeenCalledWith(
            expect.objectContaining({ date_from: '2026-09-25', date_to: '2026-09-24' }),
            expect.any(AbortSignal),
        );
    });

    it('resets page one when a filter changes', async () => {
        const firstPage = listResponse([expense], 11);
        firstPage.meta.last_page = 2;
        const list = vi.spyOn(expenseService, 'list').mockResolvedValue(firstPage);
        render(<ExpensePage />);
        await screen.findByText(/Page 1 of 2/);

        fireEvent.click(screen.getByRole('button', { name: 'Next' }));
        await waitFor(() => expect(list).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }), expect.any(AbortSignal)));

        fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Food' } });
        await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, category: 'Food' }), expect.any(AbortSignal)));
    });

    it('debounces title search and clears all list controls', async () => {
        const list = vi.spyOn(expenseService, 'list').mockResolvedValue(listResponse([]));
        render(<ExpensePage />);
        await screen.findByRole('heading', { name: 'No expenses yet' });
        vi.useFakeTimers();

        fireEvent.change(screen.getByLabelText('Search title'), { target: { value: 'lunch' } });
        act(() => {
            vi.advanceTimersByTime(299);
        });
        expect(list).toHaveBeenCalledTimes(1);
        await act(async () => {
            vi.advanceTimersByTime(1);
            await Promise.resolve();
        });
        expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'lunch', page: 1 }), expect.any(AbortSignal));

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
            await Promise.resolve();
        });
        expect(screen.getByLabelText('Search title')).toHaveValue('');
        expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ search: '', page: 1, sort: 'expense_date', direction: 'desc' }), expect.any(AbortSignal));
    });

    it('leaves the expense intact when deletion is cancelled', async () => {
        vi.spyOn(expenseService, 'list').mockResolvedValue(listResponse([expense]));
        const remove = vi.spyOn(expenseService, 'remove');
        render(<ExpensePage />);
        await screen.findAllByText('Team lunch');

        fireEvent.click(screen.getAllByRole('button', { name: 'Delete Team lunch' })[0]!);
        expect(screen.getByText(/Delete “Team lunch”/)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(remove).not.toHaveBeenCalled();
        expect(screen.getAllByText('Team lunch').length).toBeGreaterThan(0);
    });

    it('refreshes the list only after successful deletion', async () => {
        const list = vi.spyOn(expenseService, 'list')
            .mockResolvedValueOnce(listResponse([expense]))
            .mockResolvedValueOnce(listResponse([]));
        vi.spyOn(expenseService, 'remove').mockResolvedValue();
        render(<ExpensePage />);
        await screen.findAllByText('Team lunch');

        fireEvent.click(screen.getAllByRole('button', { name: 'Delete Team lunch' })[0]!);
        fireEvent.click(screen.getByRole('button', { name: 'Delete expense' }));

        await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
        expect(await screen.findByRole('heading', { name: 'No expenses yet' })).toBeInTheDocument();
    });

    it('returns to the nearest valid page when deletion empties the current page', async () => {
        const firstPage = listResponse([expense], 11);
        firstPage.meta.last_page = 2;
        const secondPage = listResponse([expense], 11);
        secondPage.meta.current_page = 2;
        secondPage.meta.from = 11;
        secondPage.meta.to = 11;
        secondPage.meta.last_page = 2;
        const emptiedPage = listResponse([], 10);
        emptiedPage.meta.current_page = 2;
        const list = vi.spyOn(expenseService, 'list')
            .mockResolvedValueOnce(firstPage)
            .mockResolvedValueOnce(secondPage)
            .mockResolvedValueOnce(emptiedPage)
            .mockResolvedValueOnce(listResponse([]));
        vi.spyOn(expenseService, 'remove').mockResolvedValue();
        render(<ExpensePage />);
        await screen.findByText(/Page 1 of 2/);

        fireEvent.click(screen.getByRole('button', { name: 'Next' }));
        await screen.findByText(/Page 2 of 2/);
        fireEvent.click(screen.getAllByRole('button', { name: 'Delete Team lunch' })[0]!);
        fireEvent.click(screen.getByRole('button', { name: 'Delete expense' }));

        await waitFor(() => expect(list).toHaveBeenLastCalledWith(
            expect.objectContaining({ page: 1 }),
            expect.any(AbortSignal),
        ));
    });

    it('keeps the record visible when deletion fails', async () => {
        const list = vi.spyOn(expenseService, 'list').mockResolvedValue(listResponse([expense]));
        const remove = vi.spyOn(expenseService, 'remove').mockRejectedValue(new ExpenseServiceError('Delete failed.', 500));
        render(<ExpensePage />);
        await screen.findAllByText('Team lunch');

        fireEvent.click(screen.getAllByRole('button', { name: 'Delete Team lunch' })[0]!);
        fireEvent.click(screen.getByRole('button', { name: 'Delete expense' }));

        await waitFor(() => expect(remove).toHaveBeenCalledWith(expense.id));
        expect(screen.getAllByText('Team lunch').length).toBeGreaterThan(0);
        expect(list).toHaveBeenCalledTimes(1);
    });

    it('creates an expense and refreshes the list after the API confirms it', async () => {
        const list = vi.spyOn(expenseService, 'list').mockResolvedValue(listResponse([]));
        const create = vi.spyOn(expenseService, 'create').mockResolvedValue(expense);
        render(<ExpensePage />);
        await screen.findByRole('heading', { name: 'No expenses yet' });

        fireEvent.click(screen.getByRole('button', { name: 'Add expense' }));
        fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Team lunch' } });
        fireEvent.change(screen.getByLabelText('Amount (₱)'), { target: { value: '1250.00' } });
        fireEvent.change(screen.getByLabelText('Expense date'), { target: { value: '2026-09-24' } });
        fireEvent.click(screen.getByRole('button', { name: 'Create expense' }));

        await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({ title: 'Team lunch', amount: '1250.00' })));
        await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    });

    it('updates an expense and refreshes the list after the API confirms it', async () => {
        const list = vi.spyOn(expenseService, 'list').mockResolvedValue(listResponse([expense]));
        const update = vi.spyOn(expenseService, 'update').mockResolvedValue({ ...expense, title: 'Updated lunch' });
        render(<ExpensePage />);
        await screen.findAllByText('Team lunch');

        fireEvent.click(screen.getAllByRole('button', { name: 'Edit Team lunch' })[0]!);
        fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Updated lunch' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

        await waitFor(() => expect(update).toHaveBeenCalledWith(expense.id, expect.objectContaining({ title: 'Updated lunch' })));
        await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    });

    it('shows a not-found state for an expense removed elsewhere', async () => {
        vi.spyOn(expenseService, 'list').mockResolvedValue(listResponse([expense]));
        vi.spyOn(expenseService, 'show').mockRejectedValue(new ExpenseServiceError('This expense could not be found.', 404));
        render(<ExpensePage />);
        await screen.findAllByText('Team lunch');

        fireEvent.click(screen.getAllByRole('button', { name: 'View Team lunch' })[0]!);

        expect(await screen.findByRole('alert')).toHaveTextContent('This expense could not be found.');
    });
});
