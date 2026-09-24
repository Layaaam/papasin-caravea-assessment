import { useForm } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { isPredefinedCategory, predefinedCategories } from '@/lib/categories';
import { getManilaCalendarDate } from '@/lib/formatters';
import type { Expense, ExpenseFieldErrors, ExpenseInput } from '@/types/expense';

interface ExpenseFormProps {
    expense?: Expense | undefined;
    onSuccess: (message: string) => void;
    onCancel: () => void;
}

const selectClasses =
    'border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]';

function FieldError({ name, errors }: { name: keyof ExpenseInput; errors: ExpenseFieldErrors }) {
    const message = errors[name];

    return message ? (
        <p id={`${name}-error`} role="alert" className="text-destructive text-sm">
            {message}
        </p>
    ) : null;
}

export function ExpenseForm({ expense, onSuccess, onCancel }: ExpenseFormProps) {
    const initialCustomCategory = expense !== undefined && !isPredefinedCategory(expense.category);
    const [categoryChoice, setCategoryChoice] = useState(initialCustomCategory ? 'Other' : (expense?.category ?? 'Food'));
    const [customCategory, setCustomCategory] = useState(initialCustomCategory ? expense.category : '');
    const [formError, setFormError] = useState<string | null>(null);
    const form = useForm<ExpenseInput>({
        title: expense?.title ?? '',
        amount: expense?.amount ?? '',
        category: expense?.category ?? 'Food',
        expense_date: expense?.expense_date ?? '',
        notes: expense?.notes ?? '',
    });

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (form.processing) {
            return;
        }

        setFormError(null);
        form.clearErrors();
        form.transform((data) => {
            const notes = data.notes?.trim();

            return {
                ...data,
                title: data.title.trim(),
                amount: data.amount.trim(),
                category: categoryChoice === 'Other' ? customCategory.trim() : categoryChoice,
                notes: notes === '' ? null : (notes ?? null),
            };
        });

        const options = {
            preserveScroll: true,
            onError: () => setFormError('Please correct the highlighted fields.'),
            onHttpException: () => {
                setFormError('Unable to save the expense. Please try again.');
                return false;
            },
            onNetworkError: () => {
                setFormError('Unable to reach the server. Please try again.');
                return false;
            },
            onSuccess: (page: { flash: { success?: string } }) => {
                onSuccess(page.flash.success ?? (expense ? 'Expense updated.' : 'Expense created.'));
            },
        };

        if (expense) {
            form.put(`/expenses/${expense.id}`, options);
        } else {
            form.post('/expenses', options);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-5 overflow-hidden">
            {formError && (
                <p role="alert" className="text-destructive text-sm">
                    {formError}
                </p>
            )}
            <div className="flex flex-col gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    value={form.data.title}
                    onChange={(event) => form.setData('title', event.target.value)}
                    required
                    maxLength={255}
                    aria-invalid={Boolean(form.errors.title)}
                    aria-describedby={form.errors.title ? 'title-error' : undefined}
                />
                <FieldError name="title" errors={form.errors} />
            </div>
            <div className="grid min-w-0 gap-5 sm:grid-cols-2">
                <div className="flex min-w-0 flex-col gap-2">
                    <Label htmlFor="amount">Amount (₱)</Label>
                    <Input
                        id="amount"
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        max="9999999999.99"
                        step="0.01"
                        value={form.data.amount}
                        onChange={(event) => form.setData('amount', event.target.value)}
                        required
                        aria-invalid={Boolean(form.errors.amount)}
                        aria-describedby={form.errors.amount ? 'amount-error' : undefined}
                    />
                    <FieldError name="amount" errors={form.errors} />
                </div>
                <div className="flex min-w-0 flex-col gap-2">
                    <Label htmlFor="expense_date">Expense date</Label>
                    <Input
                        id="expense_date"
                        type="date"
                        max={getManilaCalendarDate()}
                        value={form.data.expense_date}
                        onChange={(event) => form.setData('expense_date', event.target.value)}
                        required
                        aria-invalid={Boolean(form.errors.expense_date)}
                        aria-describedby={form.errors.expense_date ? 'expense_date-error' : undefined}
                    />
                    <FieldError name="expense_date" errors={form.errors} />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="category">Category</Label>
                <select
                    id="category"
                    className={selectClasses}
                    value={categoryChoice}
                    onChange={(event) => {
                        setCategoryChoice(event.target.value);
                        form.clearErrors('category');
                    }}
                    required
                    aria-invalid={Boolean(form.errors.category)}
                    aria-describedby={form.errors.category ? 'category-error' : undefined}
                >
                    {predefinedCategories.map((category) => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                    <option value="Other">Other</option>
                </select>
                {categoryChoice === 'Other' && (
                    <div className="flex flex-col gap-2 pt-2">
                        <Label htmlFor="custom_category">Category name</Label>
                        <Input
                            id="custom_category"
                            value={customCategory}
                            onChange={(event) => setCustomCategory(event.target.value)}
                            required
                            maxLength={100}
                            aria-invalid={Boolean(form.errors.category)}
                            aria-describedby={form.errors.category ? 'category-error' : undefined}
                        />
                    </div>
                )}
                <FieldError name="category" errors={form.errors} />
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                    id="notes"
                    className="h-32 max-h-56 resize-y"
                    wrap="soft"
                    value={form.data.notes ?? ''}
                    onChange={(event) => form.setData('notes', event.target.value)}
                    maxLength={2000}
                    rows={4}
                    aria-invalid={Boolean(form.errors.notes)}
                    aria-describedby={form.errors.notes ? 'notes-error' : undefined}
                />
                <FieldError name="notes" errors={form.errors} />
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={form.processing}>
                    Cancel
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {form.processing ? 'Saving…' : expense ? 'Save changes' : 'Create expense'}
                </Button>
            </div>
        </form>
    );
}
