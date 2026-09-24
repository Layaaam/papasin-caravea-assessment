import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { availableCategories } from '@/lib/categories';
import type { ExpenseQuery, ExpenseSort, PageSize, SortDirection } from '@/types/expense';

interface ExpenseFiltersProps {
    query: ExpenseQuery;
    searchDraft: string;
    categories: string[];
    dateRangeError: string | null;
    onSearchChange: (value: string) => void;
    onChange: (changes: Partial<ExpenseQuery>) => void;
    onClear: () => void;
}

const selectClasses =
    'border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px]';

export function ExpenseFilters({
    query,
    searchDraft,
    categories,
    dateRangeError,
    onSearchChange,
    onChange,
    onClear,
}: ExpenseFiltersProps) {
    const categoryOptions = availableCategories([...categories, query.category].filter(Boolean));

    return (
        <Card className="bg-card shadow-sm">
            <CardContent className="grid gap-5 pt-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label htmlFor="expense-search">Search title</Label>
                    <Input
                        id="expense-search"
                        value={searchDraft}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Search expenses"
                        maxLength={255}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="expense-category-filter">Category</Label>
                    <select
                        id="expense-category-filter"
                        className={selectClasses}
                        value={query.category}
                        onChange={(event) => onChange({ category: event.target.value })}
                    >
                        <option value="">All categories</option>
                        {categoryOptions.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="expense-sort">Sort by</Label>
                    <select
                        id="expense-sort"
                        className={selectClasses}
                        value={query.sort}
                        onChange={(event) => onChange({ sort: event.target.value as ExpenseSort })}
                    >
                        <option value="expense_date">Expense date</option>
                        <option value="title">Title</option>
                        <option value="amount">Amount</option>
                        <option value="category">Category</option>
                    </select>
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="expense-date-from">From date</Label>
                    <Input
                        id="expense-date-from"
                        type="date"
                        value={query.date_from}
                        onChange={(event) => onChange({ date_from: event.target.value })}
                        aria-invalid={dateRangeError !== null}
                        aria-describedby={dateRangeError ? 'expense-date-range-error' : undefined}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="expense-date-to">To date</Label>
                    <Input
                        id="expense-date-to"
                        type="date"
                        value={query.date_to}
                        onChange={(event) => onChange({ date_to: event.target.value })}
                        aria-invalid={dateRangeError !== null}
                        aria-describedby={dateRangeError ? 'expense-date-range-error' : undefined}
                    />
                    {dateRangeError && (
                        <p id="expense-date-range-error" role="alert" className="text-destructive text-sm">
                            {dateRangeError}
                        </p>
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="expense-direction">Direction</Label>
                    <select
                        id="expense-direction"
                        className={selectClasses}
                        value={query.direction}
                        onChange={(event) => onChange({ direction: event.target.value as SortDirection })}
                    >
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                    </select>
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="expense-page-size">Per page</Label>
                    <select
                        id="expense-page-size"
                        className={selectClasses}
                        value={query.per_page}
                        onChange={(event) => onChange({ per_page: Number(event.target.value) as PageSize })}
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>
                <div className="flex items-end sm:col-span-2 lg:col-span-4">
                    <Button type="button" variant="outline" onClick={onClear}>
                        Clear all
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
