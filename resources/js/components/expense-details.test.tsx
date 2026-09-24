import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ExpenseDetails } from '@/components/expense-details';
import type { Expense } from '@/types/expense';

const expense: Expense = {
    id: 7,
    title: 'Team lunch',
    amount: '1250.00',
    category: 'Food',
    expense_date: '2026-09-24',
    notes: 'a'.repeat(600),
    created_at: '2026-09-24T08:00:00.000000Z',
    updated_at: '2026-09-24T08:00:00.000000Z',
};

const scrollHeightDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight');
const clientHeightDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight');

function setElementHeights(scrollHeight: number, clientHeight: number) {
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get: () => scrollHeight });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => clientHeight });
}

afterEach(() => {
    if (scrollHeightDescriptor) {
        Object.defineProperty(HTMLElement.prototype, 'scrollHeight', scrollHeightDescriptor);
    } else {
        Reflect.deleteProperty(HTMLElement.prototype, 'scrollHeight');
    }

    if (clientHeightDescriptor) {
        Object.defineProperty(HTMLElement.prototype, 'clientHeight', clientHeightDescriptor);
    } else {
        Reflect.deleteProperty(HTMLElement.prototype, 'clientHeight');
    }
});

describe('ExpenseDetails', () => {
    it('presents the amount as the primary value with supporting expense metadata', () => {
        setElementHeights(60, 60);
        render(<ExpenseDetails expense={expense} isLoading={false} error={null} />);

        expect(screen.getByText(/1,250\.00/)).toHaveClass('text-3xl', 'font-bold');
        expect(screen.getByText('Food')).toBeInTheDocument();
        expect(screen.getAllByText('Sep 24, 2026')).toHaveLength(2);
        expect(screen.getByText('Notes')).toBeInTheDocument();
    });

    it('clamps overflowing notes and expands them into a vertical scroll area', () => {
        setElementHeights(120, 60);
        render(<ExpenseDetails expense={expense} isLoading={false} error={null} />);

        const notes = screen.getByText(expense.notes!);
        expect(notes).toHaveClass('line-clamp-3', 'wrap-anywhere');

        fireEvent.click(screen.getByRole('button', { name: 'See more' }));

        expect(notes).toHaveClass('max-h-64', 'overflow-y-auto', 'overflow-x-hidden', 'wrap-anywhere');
        expect(screen.getByRole('button', { name: 'See less' })).toHaveAttribute('aria-expanded', 'true');
    });

    it('does not show an expansion control when notes fit within three lines', () => {
        setElementHeights(60, 60);
        render(<ExpenseDetails expense={{ ...expense, notes: 'Short note.' }} isLoading={false} error={null} />);

        expect(screen.getByText('Short note.')).toHaveClass('line-clamp-3');
        expect(screen.queryByRole('button', { name: 'See more' })).not.toBeInTheDocument();
    });
});
