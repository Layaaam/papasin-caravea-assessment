import { EyeIcon, PencilIcon, Trash2Icon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatExpenseDate, formatPeso } from '@/lib/formatters';
import type { Expense } from '@/types/expense';

interface ExpenseResultsProps {
    expenses: Expense[];
    isLoading: boolean;
    hasFilters: boolean;
    onView: (expense: Expense) => void;
    onEdit: (expense: Expense) => void;
    onDelete: (expense: Expense) => void;
}

function ExpenseActions({
    expense,
    onView,
    onEdit,
    onDelete,
}: Pick<ExpenseResultsProps, 'onView' | 'onEdit' | 'onDelete'> & { expense: Expense }) {
    return (
        <div className="flex flex-wrap justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={() => onView(expense)} aria-label={`View ${expense.title}`}>
                <EyeIcon aria-hidden="true" />
                View
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onEdit(expense)} aria-label={`Edit ${expense.title}`}>
                <PencilIcon aria-hidden="true" />
                Edit
            </Button>
            <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(expense)}
                aria-label={`Delete ${expense.title}`}
            >
                <Trash2Icon aria-hidden="true" />
                Delete
            </Button>
        </div>
    );
}

export function ExpenseResults({ expenses, isLoading, hasFilters, onView, onEdit, onDelete }: ExpenseResultsProps) {
    if (isLoading) {
        return (
            <div aria-busy="true" aria-label="Loading expenses">
                <div className="grid gap-3 md:hidden">
                    {[1, 2, 3].map((index) => (
                        <Card key={index} className="bg-card py-5 shadow-sm">
                            <CardContent className="flex flex-col gap-4">
                                <div className="flex items-center justify-between gap-4">
                                    <Skeleton className="h-5 w-2/5" />
                                    <Skeleton className="h-5 w-1/4" />
                                </div>
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-8 w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card className="hidden overflow-hidden border bg-card py-0 shadow-sm md:block">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="px-6">Title</TableHead>
                                <TableHead className="px-6">Category</TableHead>
                                <TableHead className="px-6">Date</TableHead>
                                <TableHead className="px-6 text-right">Amount</TableHead>
                                <TableHead className="px-6 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[1, 2, 3].map((index) => (
                                <TableRow key={index}>
                                    <TableCell className="px-6 py-4"><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell className="px-6 py-4"><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell className="px-6 py-4"><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell className="px-6 py-4"><Skeleton className="ml-auto h-4 w-24" /></TableCell>
                                    <TableCell className="px-6 py-4"><Skeleton className="ml-auto h-8 w-40" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        );
    }

    if (expenses.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col gap-2 py-16 text-center">
                    <h2 className="text-xl font-semibold">{hasFilters ? 'No matching expenses' : 'No expenses yet'}</h2>
                    <p className="text-muted-foreground text-sm">
                        {hasFilters ? 'Try changing or clearing your filters.' : 'Create an expense to start tracking.'}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="grid gap-3 md:hidden">
                {expenses.map((expense) => (
                    <Card key={expense.id} className="bg-card shadow-sm">
                        <CardContent className="flex flex-col gap-4 py-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex flex-col gap-2">
                                    <h2 className="font-semibold">{expense.title}</h2>
                                    <Badge variant="secondary" className="w-fit">
                                        {expense.category}
                                    </Badge>
                                </div>
                                <span className="shrink-0 font-semibold tabular-nums">{formatPeso(expense.amount)}</span>
                            </div>
                            <p className="text-muted-foreground text-sm">{formatExpenseDate(expense.expense_date)}</p>
                            <ExpenseActions expense={expense} onView={onView} onEdit={onEdit} onDelete={onDelete} />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card className="hidden overflow-hidden border bg-card py-0 shadow-sm md:block">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="px-6">Title</TableHead>
                            <TableHead className="px-6">Category</TableHead>
                            <TableHead className="px-6">Date</TableHead>
                            <TableHead className="px-6 text-right">Amount</TableHead>
                            <TableHead className="px-6 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {expenses.map((expense) => (
                            <TableRow key={expense.id}>
                                <TableCell className="max-w-72 px-6 py-4 font-semibold whitespace-normal wrap-anywhere">{expense.title}</TableCell>
                                <TableCell className="px-6 py-4">
                                    <Badge variant="secondary">{expense.category}</Badge>
                                </TableCell>
                                <TableCell className="px-6 py-4">{formatExpenseDate(expense.expense_date)}</TableCell>
                                <TableCell className="px-6 py-4 text-right font-semibold tabular-nums">
                                    {formatPeso(expense.amount)}
                                </TableCell>
                                <TableCell className="px-6 py-4">
                                    <ExpenseActions expense={expense} onView={onView} onEdit={onEdit} onDelete={onDelete} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </>
    );
}
