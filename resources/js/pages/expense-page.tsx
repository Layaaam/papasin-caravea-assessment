import { useEffect, useState } from 'react';
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
import { ExpenseServiceError, expenseService } from '@/services/expense-service';
import { defaultExpenseQuery, type Expense, type ExpenseInput, type ExpenseListResponse, type ExpenseQuery } from '@/types/expense';

function errorMessage(error: unknown): string {
    return error instanceof ExpenseServiceError ? error.message : 'Something went wrong. Please try again.';
}

export function ExpensePage() {
    const [query, setQuery] = useState<ExpenseQuery>(defaultExpenseQuery);
    const [searchDraft, setSearchDraft] = useState('');
    const [listResponse, setListResponse] = useState<ExpenseListResponse | null>(null);
    const [categories, setCategories] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [listError, setListError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [detailsExpense, setDetailsExpense] = useState<Expense | null>(null);
    const [detailsTitle, setDetailsTitle] = useState('');
    const [detailsId, setDetailsId] = useState<number | null>(null);
    const [detailsError, setDetailsError] = useState<string | null>(null);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);
    const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const dateRangeError =
        query.date_from && query.date_to && query.date_from > query.date_to
            ? 'The start date must be on or before the end date.'
            : null;
    const hasFilters = Boolean(query.search || query.category || query.date_from || query.date_to);

    function updateQuery(changes: Partial<ExpenseQuery>) {
        setQuery((current) => ({ ...current, ...changes, page: 1 }));
        setListResponse(null);
        setListError(null);
        setIsLoading(true);
    }

    function changePage(page: number) {
        setQuery((current) => ({ ...current, page }));
        setListResponse(null);
        setListError(null);
        setIsLoading(true);
    }

    function refreshList() {
        setListResponse(null);
        setListError(null);
        setIsLoading(true);
        setReloadKey((current) => current + 1);
    }

    useEffect(() => {
        if (searchDraft === query.search) {
            return;
        }

        const timeout = window.setTimeout(() => {
            setQuery((current) => ({ ...current, search: searchDraft, page: 1 }));
            setListResponse(null);
            setListError(null);
            setIsLoading(true);
        }, 300);
        return () => window.clearTimeout(timeout);
    }, [searchDraft, query.search]);

    useEffect(() => {
        if (dateRangeError) {
            return;
        }

        const controller = new AbortController();

        void expenseService.list(query, controller.signal).then(
            (response) => {
                if (controller.signal.aborted) {
                    return;
                }

                if (query.page > response.meta.last_page && query.page > 1) {
                    changePage(Math.max(1, response.meta.last_page));
                    return;
                }

                setListResponse(response);
                setCategories(response.meta.categories);
                setIsLoading(false);
            },
            (error: unknown) => {
                if (!controller.signal.aborted) {
                    setListError(errorMessage(error));
                    setIsLoading(false);
                }
            },
        );

        return () => controller.abort();
    }, [query, reloadKey, dateRangeError]);

    useEffect(() => {
        if (detailsId === null) {
            return;
        }

        const controller = new AbortController();

        void expenseService.show(detailsId, controller.signal).then(
            (expense) => {
                if (!controller.signal.aborted) {
                    setDetailsExpense(expense);
                    setIsDetailsLoading(false);
                }
            },
            (error: unknown) => {
                if (!controller.signal.aborted) {
                    setDetailsError(errorMessage(error));
                    setIsDetailsLoading(false);
                }
            },
        );

        return () => controller.abort();
    }, [detailsId]);

    function openDetails(expense: Expense) {
        setDetailsExpense(null);
        setDetailsError(null);
        setDetailsTitle(expense.title);
        setIsDetailsLoading(true);
        setDetailsId(expense.id);
    }

    async function saveExpense(input: ExpenseInput): Promise<void> {
        if (editingExpense) {
            await expenseService.update(editingExpense.id, input);
            toast.success('Expense updated.');
        } else {
            await expenseService.create(input);
            toast.success('Expense created.');
        }

        setIsFormOpen(false);
        refreshList();
    }

    async function deleteExpense(): Promise<void> {
        if (!deletingExpense || isDeleting) {
            return;
        }

        setIsDeleting(true);

        try {
            await expenseService.remove(deletingExpense.id);
            setDeletingExpense(null);
            toast.success('Expense deleted.');
            refreshList();
        } catch (error) {
            toast.error(errorMessage(error));
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <main className="bg-background text-foreground min-h-svh">
            <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">Personal finance</p>
                        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Expenses</h1>
                        <p className="text-muted-foreground">Review and manage your spending in one place.</p>
                    </div>
                    <Button
                        onClick={() => {
                            setEditingExpense(null);
                            setIsFormOpen(true);
                        }}
                    >
                        Add expense
                    </Button>
                </header>

                <ExpenseFilters
                    query={query}
                    searchDraft={searchDraft}
                    categories={categories}
                    dateRangeError={dateRangeError}
                    onSearchChange={setSearchDraft}
                    onChange={updateQuery}
                    onClear={() => {
                        setSearchDraft('');
                        updateQuery(defaultExpenseQuery);
                    }}
                />

                {listError && (
                    <div role="alert" className="border-destructive/30 bg-destructive/5 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                        <p className="text-sm">{listError}</p>
                        <Button variant="outline" size="sm" onClick={refreshList}>Try again</Button>
                    </div>
                )}

                {!dateRangeError && !listError && (
                    <div className="flex flex-col gap-5">
                        <ExpenseResults
                            expenses={listResponse?.data ?? []}
                            isLoading={isLoading}
                            hasFilters={hasFilters}
                            onView={openDetails}
                            onEdit={(expense) => {
                                setEditingExpense(expense);
                                setIsFormOpen(true);
                            }}
                            onDelete={setDeletingExpense}
                        />
                        {listResponse && <ExpensePagination meta={listResponse.meta} onPageChange={changePage} />}
                    </div>
                )}
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
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
                            onSubmit={saveExpense}
                            onCancel={() => setIsFormOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={detailsId !== null} onOpenChange={(open) => { if (!open) setDetailsId(null); }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{detailsTitle}</DialogTitle>
                        <DialogDescription>Expense details</DialogDescription>
                    </DialogHeader>
                    <ExpenseDetails expense={detailsExpense} isLoading={isDetailsLoading} error={detailsError} />
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
                            onClick={(event) => { event.preventDefault(); void deleteExpense(); }}
                        >
                            {isDeleting ? 'Deleting…' : 'Delete expense'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Toaster richColors position="top-right" />
        </main>
    );
}
