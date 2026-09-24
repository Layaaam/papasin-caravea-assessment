import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatExpenseDate, formatPeso } from '@/lib/formatters';
import type { Expense } from '@/types/expense';

interface ExpenseDetailsProps {
    expense: Expense | null;
    isLoading: boolean;
    error: string | null;
}

export function ExpenseDetails({ expense, isLoading, error }: ExpenseDetailsProps) {
    if (isLoading) {
        return (
            <div aria-busy="true" aria-label="Loading expense details" className="flex flex-col gap-4">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-24 w-full" />
            </div>
        );
    }

    if (error) {
        return <p role="alert" className="text-destructive text-sm">{error}</p>;
    }

    if (!expense) {
        return null;
    }

    return (
        <dl className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground text-sm">Amount</dt>
                <dd className="text-xl font-semibold tabular-nums">{formatPeso(expense.amount)}</dd>
            </div>
            <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground text-sm">Category</dt>
                <dd><Badge variant="secondary">{expense.category}</Badge></dd>
            </div>
            <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground text-sm">Expense date</dt>
                <dd>{formatExpenseDate(expense.expense_date)}</dd>
            </div>
            <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground text-sm">Last updated</dt>
                <dd>{new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeZone: 'Asia/Manila' }).format(new Date(expense.updated_at))}</dd>
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
                <dt className="text-muted-foreground text-sm">Notes</dt>
                <dd className="whitespace-pre-wrap">{expense.notes?.trim() ? expense.notes : 'No notes added.'}</dd>
            </div>
        </dl>
    );
}
