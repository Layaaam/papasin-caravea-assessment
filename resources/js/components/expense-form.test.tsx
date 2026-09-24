import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ExpenseForm } from '@/components/expense-form';
import { ExpenseServiceError } from '@/services/expense-service';
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

describe('ExpenseForm', () => {
    it('reveals and requires a custom category when Other is selected', () => {
        render(<ExpenseForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

        expect(screen.queryByRole('textbox', { name: 'Category name' })).not.toBeInTheDocument();
        fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Other' } });

        expect(screen.getByRole('textbox', { name: 'Category name' })).toBeRequired();
    });

    it('restores a stored custom category when editing', () => {
        render(<ExpenseForm expense={customExpense} onSubmit={vi.fn()} onCancel={vi.fn()} />);

        expect(screen.getByLabelText('Title')).toHaveValue('Team lunch');
        expect(screen.getByLabelText('Category')).toHaveValue('Other');
        expect(screen.getByRole('textbox', { name: 'Category name' })).toHaveValue('Client Meals');
    });

    it('keeps entered values and displays field errors returned by Laravel', async () => {
        const onSubmit = vi.fn(() => Promise.reject(
            new ExpenseServiceError('Validation failed.', 422, { title: ['The title field is required.'] }),
        ));
        render(<ExpenseForm expense={customExpense} onSubmit={onSubmit} onCancel={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

        expect(await screen.findByText('The title field is required.')).toHaveAttribute('role', 'alert');
        expect(screen.getByLabelText('Title')).toHaveValue('Team lunch');
    });

    it('disables submission while saving and submits the custom value', async () => {
        let finishSave: (() => void) | undefined;
        const onSubmit = vi.fn(() => new Promise<void>((resolve) => { finishSave = resolve; }));
        render(<ExpenseForm expense={customExpense} onSubmit={onSubmit} onCancel={vi.fn()} />);

        fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

        expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
        expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ category: 'Client Meals' }));
        finishSave?.();
        await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled());
    });
});
