import { router } from '@inertiajs/react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ExpenseForm } from '@/components/expense-form';
import type { Expense } from '@/types/expense';

const customExpense: Expense = {
    id: 7,
    title: 'Team lunch',
    amount: '1250.00',
    category: 'Client Meals',
    expense_date: '2026-09-24',
    notes: 'Planning session',
    created_at: '2026-09-24T08:00:00.000000Z',
    updated_at: '2026-09-24T08:00:00.000000Z',
};

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
});

describe('ExpenseForm', () => {
    it('prevents selecting a date after the current Manila calendar date', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-09-24T16:30:00Z'));

        render(<ExpenseForm onSuccess={vi.fn()} onCancel={vi.fn()} />);

        expect(screen.getByLabelText('Expense date')).toHaveAttribute('max', '2026-09-25');
    });

    it('contains long notes in a vertically scrollable wrapped textarea', () => {
        render(<ExpenseForm onSuccess={vi.fn()} onCancel={vi.fn()} />);

        const notes = screen.getByLabelText('Notes (optional)');

        expect(notes).toHaveAttribute('wrap', 'soft');
        expect(notes).toHaveClass('overflow-x-hidden', 'overflow-y-auto', 'wrap-anywhere', 'max-h-56');
    });

    it('reveals and requires a custom category when Other is selected', () => {
        render(<ExpenseForm onSuccess={vi.fn()} onCancel={vi.fn()} />);

        expect(screen.queryByRole('textbox', { name: 'Category name' })).not.toBeInTheDocument();
        fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Other' } });

        expect(screen.getByRole('textbox', { name: 'Category name' })).toBeRequired();
    });

    it('restores a stored custom category when editing', () => {
        render(<ExpenseForm expense={customExpense} onSuccess={vi.fn()} onCancel={vi.fn()} />);

        expect(screen.getByLabelText('Title')).toHaveValue('Team lunch');
        expect(screen.getByLabelText('Category')).toHaveValue('Other');
        expect(screen.getByRole('textbox', { name: 'Category name' })).toHaveValue('Client Meals');
    });

    it('keeps entered values and displays field errors returned by Laravel', async () => {
        vi.spyOn(router, 'put').mockImplementation((_url, _data, options) => {
            options?.onError?.({ title: 'The title field is required.' });
        });
        render(<ExpenseForm expense={customExpense} onSuccess={vi.fn()} onCancel={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

        expect(await screen.findByText('The title field is required.')).toHaveAttribute('role', 'alert');
        expect(screen.getByLabelText('Title')).toHaveValue('Team lunch');
    });

    it('disables submission while saving and submits the custom value', () => {
        let finishSave: (() => void) | undefined;
        const put = vi.spyOn(router, 'put').mockImplementation((_url, _data, options) => {
            options?.onStart?.({} as never);
            finishSave = () => options?.onFinish?.({} as never);
        });
        render(<ExpenseForm expense={customExpense} onSuccess={vi.fn()} onCancel={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

        expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
        expect(put).toHaveBeenCalledWith(
            '/expenses/7',
            expect.objectContaining({ category: 'Client Meals' }),
            expect.objectContaining({ preserveScroll: true }),
        );
        act(() => finishSave?.());
        expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
    });

    it('submits a new expense through the Inertia store route', () => {
        const post = vi.spyOn(router, 'post').mockImplementation(() => undefined);
        render(<ExpenseForm onSuccess={vi.fn()} onCancel={vi.fn()} />);

        fireEvent.change(screen.getByLabelText('Title'), { target: { value: '  Team lunch  ' } });
        fireEvent.change(screen.getByLabelText('Amount (₱)'), { target: { value: '1250.00' } });
        fireEvent.change(screen.getByLabelText('Expense date'), { target: { value: '2026-09-24' } });
        fireEvent.click(screen.getByRole('button', { name: 'Create expense' }));

        expect(post).toHaveBeenCalledWith(
            '/expenses',
            expect.objectContaining({ title: 'Team lunch', amount: '1250.00' }),
            expect.objectContaining({ preserveScroll: true }),
        );
    });
});
