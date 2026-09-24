import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { ExpenseDetails } from '@/components/expense-details';
import { ExpenseFilters } from '@/components/expense-filters';
import { ExpenseForm } from '@/components/expense-form';
import { ExpensePagination } from '@/components/expense-pagination';
import { ExpenseResults } from '@/components/expense-results';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Toaster } from '@/components/ui/sonner';
import { expenseQueryParameters } from '@/lib/expense-query';
import { defaultExpenseQuery, type Expense, type ExpenseIndexPageProps, type ExpenseQuery } from '@/types/expense';

export default function ExpenseIndex({ expenses, filters, categories }: ExpenseIndexPageProps) {
    const [pendingQuery, setPendingQuery] = useState<ExpenseQuery | null>(null);
    const [searchDraft, setSearchDraft] = useState(filters.search);
    const [isLoading, setIsLoading] = useState(false);
    const [listError, setListError] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [detailsExpense, setDetailsExpense] = useState<Expense | null>(null);
    const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const query = pendingQuery ?? filters;
    const dateRangeError =
        query.date_from && query.date_to && query.date_from > query.date_to
            ? 'The start date must be on or before the end date.'
            : null;
    const hasFilters = Boolean(query.search || query.category || query.date_from || query.date_to);

    useEffect(() => router.on('navigate', (event) => {
        const nextFilters = event.detail.page.props.filters;

        if (
            typeof nextFilters === 'object'
            && nextFilters !== null
            && 'search' in nextFilters
            && typeof nextFilters.search === 'string'
        ) {
            setSearchDraft(nextFilters.search);
        }
    }), []);

    const visitQuery = useCallback((nextQuery: ExpenseQuery, replace: boolean) => {
        setPendingQuery(nextQuery);
        setListError(null);
        setIsLoading(true);

        router.get('/', expenseQueryParameters(nextQuery), {
            only: ['expenses', 'filters'],
            preserveScroll: true,
            preserveState: true,
            replace,
            onError: (errors) => {
                setListError(Object.values(errors)[0] ?? 'The filters could not be applied.');
            },
            onHttpException: () => {
                setListError('The expenses could not be loaded. Please try again.');
                return false;
            },
            onNetworkError: () => {
                setListError('Unable to reach the server. Please try again.');
                return false;
            },
            onFinish: () => {
                setPendingQuery(null);
                setIsLoading(false);
            },
        });
    }, []);

    function updateQuery(changes: Partial<ExpenseQuery>) {
        const nextQuery = { ...query, ...changes, page: 1 };

        if (nextQuery.date_from && nextQuery.date_to && nextQuery.date_from > nextQuery.date_to) {
            setPendingQuery(nextQuery);
            return;
        }

        visitQuery(nextQuery, false);
    }

    function changePage(page: number) {
        visitQuery({ ...query, page }, false);
    }

    useEffect(() => {
        if (searchDraft === query.search) {
            return;
        }

        const timeout = window.setTimeout(() => {
            visitQuery({ ...query, search: searchDraft, page: 1 }, true);
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [query, searchDraft, visitQuery]);

    function savedExpense(message: string) {
        setIsFormOpen(false);
        setEditingExpense(null);
        toast.success(message);
    }

    function deleteExpense() {
        if (!deletingExpense || isDeleting) {
            return;
        }

        setIsDeleting(true);
        router.delete(`/expenses/${deletingExpense.id}`, {
            preserveScroll: true,
            onSuccess: (page) => {
                setDeletingExpense(null);
                toast.success(page.flash.success ?? 'Expense deleted.');
            },
            onError: () => toast.error('The expense could not be deleted.'),
            onHttpException: () => {
                toast.error('The expense could not be deleted.');
                return false;
            },
            onNetworkError: () => {
                toast.error('Unable to reach the server. Please try again.');
                return false;
            },
            onFinish: () => setIsDeleting(false),
        });
    }

    return (
        <>
            <Head title="Expenses" />
            <main className="bg-background text-foreground min-h-svh overflow-x-hidden">
                <section className="bg-blue-900 text-white">
                    <header className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6 px-4 pt-12 pb-28 sm:px-6 lg:px-8 lg:pt-16 lg:pb-32">
                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-semibold tracking-[0.2em] text-blue-100 uppercase">Personal finance</p>
                            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Expenses</h1>
                            <p className="max-w-xl text-base text-blue-100 sm:text-lg">Review and manage your spending in one place.</p>
                        </div>
                        <Button
                            size="lg"
                            className="bg-white text-blue-900 shadow-lg shadow-blue-950/20 hover:bg-blue-50"
                            onClick={() => {
                                setEditingExpense(null);
                                setIsFormOpen(true);
                            }}
                        >
                            Add expense
                        </Button>
                    </header>
                </section>

                <div className="relative mx-auto -mt-20 flex max-w-7xl flex-col gap-8 px-4 pb-12 sm:px-6 lg:px-8 lg:pb-16">
                    <ExpenseFilters
                        query={query}
                        searchDraft={searchDraft}
                        categories={categories}
                        dateRangeError={dateRangeError}
                        onSearchChange={setSearchDraft}
                        onChange={updateQuery}
                        onClear={() => {
                            setSearchDraft('');
                            visitQuery(defaultExpenseQuery, false);
                        }}
                    />

                    {listError && (
                        <div role="alert" className="border-destructive/30 bg-destructive/5 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                            <p className="text-sm">{listError}</p>
                            <Button variant="outline" size="sm" onClick={() => visitQuery(query, true)}>Try again</Button>
                        </div>
                    )}

                    {!dateRangeError && !listError && (
                        <div className="flex flex-col gap-5">
                            <ExpenseResults
                                expenses={expenses.data}
                                isLoading={isLoading}
                                hasFilters={hasFilters}
                                onView={setDetailsExpense}
                                onEdit={(expense) => {
                                    setEditingExpense(expense);
                                    setIsFormOpen(true);
                                }}
                                onDelete={setDeletingExpense}
                            />
                            <ExpensePagination meta={expenses.meta} onPageChange={changePage} />
                        </div>
                    )}
                </div>

                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogContent className="max-h-[90svh] min-w-0 overflow-hidden sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle>{editingExpense ? 'Edit expense' : 'Add expense'}</DialogTitle>
                            <DialogDescription>
                                {editingExpense ? 'Update this expense and save your changes.' : 'Enter the details of your expense.'}
                            </DialogDescription>
                        </DialogHeader>
                        {isFormOpen && (
                            <ExpenseForm
                                key={editingExpense?.id ?? 'new'}
                                expense={editingExpense ?? undefined}
                                onSuccess={savedExpense}
                                onCancel={() => setIsFormOpen(false)}
                            />
                        )}
                    </DialogContent>
                </Dialog>

                <Dialog open={detailsExpense !== null} onOpenChange={(open) => { if (!open) setDetailsExpense(null); }}>
                    <DialogContent className="max-h-[90svh] min-w-0 gap-0 overflow-x-hidden overflow-y-auto p-0 sm:max-w-lg">
                        <DialogHeader className="border-b px-6 py-5 pr-12">
                            <DialogTitle className="text-xl leading-snug wrap-anywhere">{detailsExpense?.title}</DialogTitle>
                            <DialogDescription>Recorded expense information</DialogDescription>
                        </DialogHeader>
                        <ExpenseDetails expense={detailsExpense} isLoading={false} error={null} />
                    </DialogContent>
                </Dialog>

                <AlertDialog open={deletingExpense !== null} onOpenChange={(open) => { if (!open && !isDeleting) setDeletingExpense(null); }}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Delete “{deletingExpense?.title}”? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-white hover:bg-destructive/90"
                                disabled={isDeleting}
                                onClick={(event) => { event.preventDefault(); deleteExpense(); }}
                            >
                                {isDeleting ? 'Deleting…' : 'Delete expense'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Toaster richColors position="top-right" />
            </main>
        </>
    );
}
