import { useLayoutEffect, useRef, useState } from 'react';
import { CalendarDaysIcon, Clock3Icon, TagIcon, WalletCardsIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatExpenseDate, formatPeso } from '@/lib/formatters';
import type { Expense } from '@/types/expense';

interface ExpenseDetailsProps {
    expense: Expense | null;
    isLoading: boolean;
    error: string | null;
}

function ExpandableNotes({ notes }: { notes: string }) {
    const notesRef = useRef<HTMLParagraphElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [canExpand, setCanExpand] = useState(false);

    useLayoutEffect(() => {
        if (isExpanded) {
            return;
        }

        const notesElement = notesRef.current;

        if (!notesElement) {
            return;
        }

        function measureOverflow() {
            if (notesElement) {
                setCanExpand(notesElement.scrollHeight > notesElement.clientHeight);
            }
        }

        measureOverflow();
        window.addEventListener('resize', measureOverflow);

        return () => window.removeEventListener('resize', measureOverflow);
    }, [isExpanded]);

    return (
        <div className="flex min-w-0 flex-col items-start gap-2">
            <p
                ref={notesRef}
                className={
                    isExpanded
                        ? 'max-h-64 w-full overflow-x-hidden overflow-y-auto whitespace-pre-wrap wrap-anywhere pr-2'
                        : 'w-full overflow-hidden whitespace-pre-wrap wrap-anywhere line-clamp-3'
                }
            >
                {notes}
            </p>
            {canExpand && (
                <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto px-0 py-0"
                    aria-expanded={isExpanded}
                    onClick={() => setIsExpanded((current) => !current)}
                >
                    {isExpanded ? 'See less' : 'See more'}
                </Button>
            )}
        </div>
    );
}

export function ExpenseDetails({ expense, isLoading, error }: ExpenseDetailsProps) {
    if (isLoading) {
        return (
            <div aria-busy="true" aria-label="Loading expense details" className="flex flex-col gap-4 p-6">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-24 w-full" />
            </div>
        );
    }

    if (error) {
        return <p role="alert" className="text-destructive p-6 text-sm">{error}</p>;
    }

    if (!expense) {
        return null;
    }

    return (
        <div className="min-w-0">
            <dl className="grid gap-5 border-b bg-violet-50/70 px-6 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div className="flex min-w-0 flex-col gap-1.5">
                    <dt className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
                        <WalletCardsIcon aria-hidden="true" className="size-4 text-violet-600" />
                        Amount
                    </dt>
                    <dd className="text-3xl font-bold tracking-tight tabular-nums">{formatPeso(expense.amount)}</dd>
                </div>
                <div className="flex min-w-0 flex-col gap-1.5 sm:items-end">
                    <dt className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
                        <TagIcon aria-hidden="true" className="size-4 text-violet-600" />
                        Category
                    </dt>
                    <dd><Badge variant="secondary">{expense.category}</Badge></dd>
                </div>
            </dl>

            <dl className="grid gap-5 border-b px-6 py-5 sm:grid-cols-2">
                <div className="flex min-w-0 flex-col gap-1">
                    <dt className="text-muted-foreground flex items-center gap-3 text-sm">
                        <CalendarDaysIcon aria-hidden="true" className="size-4 shrink-0" />
                        Expense date
                    </dt>
                    <dd className="pl-7 font-medium">{formatExpenseDate(expense.expense_date)}</dd>
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                    <dt className="text-muted-foreground flex items-center gap-3 text-sm">
                        <Clock3Icon aria-hidden="true" className="size-4 shrink-0" />
                        Last updated
                    </dt>
                    <dd className="pl-7 font-medium">
                        {new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeZone: 'Asia/Manila' }).format(new Date(expense.updated_at))}
                    </dd>
                </div>
            </dl>

            <dl className="flex min-w-0 flex-col gap-2 px-6 py-5">
                <dt className="text-sm font-semibold">Notes</dt>
                <dd className="min-w-0">
                    {expense.notes?.trim() ? (
                        <ExpandableNotes key={expense.id} notes={expense.notes} />
                    ) : (
                        <span className="text-muted-foreground">No notes added.</span>
                    )}
                </dd>
            </dl>
        </div>
    );
}
