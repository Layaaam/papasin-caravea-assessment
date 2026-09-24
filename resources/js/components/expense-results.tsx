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
        <div className="flex flex-wrap gap-1">
            <Button size="sm" variant="ghost" onClick={() => onView(expense)} aria-label={`View ${expense.title}`}>
                View
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onEdit(expense)} aria-label={`Edit ${expense.title}`}>
                Edit
            </Button>
            <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(expense)}
                aria-label={`Delete ${expense.title}`}
            >
                Delete
            </Button>
        </div>
    );
}

export function ExpenseResults({ expenses, isLoading, hasFilters, onView, onEdit, onDelete }: ExpenseResultsProps) {
    if (isLoading) {
        return (
            <Card aria-busy="true" aria-label="Loading expenses">
                <CardContent className="flex flex-col gap-4 pt-6">
                    {[1, 2, 3].map((index) => (
                        <Skeleton key={index} className="h-16 w-full" />
                    ))}
                </CardContent>
            </Card>
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
                    <Card key={expense.id}>
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
            <Card className="hidden md:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {expenses.map((expense) => (
                            <TableRow key={expense.id}>
                                <TableCell className="font-medium">{expense.title}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{expense.category}</Badge>
                                </TableCell>
                                <TableCell>{formatExpenseDate(expense.expense_date)}</TableCell>
                                <TableCell className="text-right font-medium tabular-nums">
                                    {formatPeso(expense.amount)}
                                </TableCell>
                                <TableCell>
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
