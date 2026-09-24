import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { isPredefinedCategory, predefinedCategories } from '@/lib/categories';
import { ExpenseServiceError } from '@/services/expense-service';
import type { Expense, ExpenseFieldErrors, ExpenseInput } from '@/types/expense';

interface ExpenseFormProps {
    expense?: Expense | undefined;
    onSubmit: (input: ExpenseInput) => Promise<void>;
    onCancel: () => void;
}

const selectClasses =
    'border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]';

function FieldError({ name, errors }: { name: keyof ExpenseInput; errors: ExpenseFieldErrors }) {
    const message = errors[name]?.[0];

    return message ? (
        <p id={`${name}-error`} role="alert" className="text-destructive text-sm">
            {message}
        </p>
    ) : null;
}

export function ExpenseForm({ expense, onSubmit, onCancel }: ExpenseFormProps) {
    const initialCustomCategory = expense !== undefined && !isPredefinedCategory(expense.category);
    const [title, setTitle] = useState(expense?.title ?? '');
    const [amount, setAmount] = useState(expense?.amount ?? '');
    const [categoryChoice, setCategoryChoice] = useState(initialCustomCategory ? 'Other' : (expense?.category ?? 'Food'));
    const [customCategory, setCustomCategory] = useState(initialCustomCategory ? expense.category : '');
    const [expenseDate, setExpenseDate] = useState(expense?.expense_date ?? '');
    const [notes, setNotes] = useState(expense?.notes ?? '');
    const [errors, setErrors] = useState<ExpenseFieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isSaving) {
            return;
        }

        setErrors({});
        setFormError(null);
        setIsSaving(true);

        try {
            await onSubmit({
                title: title.trim(),
                amount: amount.trim(),
                category: categoryChoice === 'Other' ? customCategory.trim() : categoryChoice,
                expense_date: expenseDate,
                notes: notes.trim() || null,
            });
        } catch (error) {
            if (error instanceof ExpenseServiceError) {
                setErrors(error.errors);
                setFormError(error.status === 422 ? 'Please correct the highlighted fields.' : error.message);
            } else {
                setFormError('Unable to save the expense. Please try again.');
            }
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-5">
            {formError && (
                <p role="alert" className="text-destructive text-sm">
                    {formError}
                </p>
            )}
            <div className="flex flex-col gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                    maxLength={255}
                    aria-invalid={Boolean(errors.title)}
                    aria-describedby={errors.title ? 'title-error' : undefined}
                />
                <FieldError name="title" errors={errors} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="amount">Amount (₱)</Label>
                    <Input
                        id="amount"
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        max="9999999999.99"
                        step="0.01"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        required
                        aria-invalid={Boolean(errors.amount)}
                        aria-describedby={errors.amount ? 'amount-error' : undefined}
                    />
                    <FieldError name="amount" errors={errors} />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="expense_date">Expense date</Label>
                    <Input
                        id="expense_date"
                        type="date"
                        value={expenseDate}
                        onChange={(event) => setExpenseDate(event.target.value)}
                        required
                        aria-invalid={Boolean(errors.expense_date)}
                        aria-describedby={errors.expense_date ? 'expense_date-error' : undefined}
                    />
                    <FieldError name="expense_date" errors={errors} />
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
                        setErrors({});
                    }}
                    required
                    aria-invalid={Boolean(errors.category)}
                    aria-describedby={errors.category ? 'category-error' : undefined}
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
                            aria-invalid={Boolean(errors.category)}
                            aria-describedby={errors.category ? 'category-error' : undefined}
                        />
                    </div>
                )}
                <FieldError name="category" errors={errors} />
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                    id="notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    maxLength={2000}
                    rows={4}
                    aria-invalid={Boolean(errors.notes)}
                    aria-describedby={errors.notes ? 'notes-error' : undefined}
                />
                <FieldError name="notes" errors={errors} />
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving…' : expense ? 'Save changes' : 'Create expense'}
                </Button>
            </div>
        </form>
    );
}
