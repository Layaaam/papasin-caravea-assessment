export interface Expense {
    id: number;
    title: string;
    amount: string;
    category: string;
    expense_date: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface ExpenseInput {
    title: string;
    amount: string;
    category: string;
    expense_date: string;
    notes: string | null;
}

export type ExpenseSort = 'title' | 'amount' | 'category' | 'expense_date';
export type SortDirection = 'asc' | 'desc';
export type PageSize = 10 | 25 | 50;

export interface ExpenseQuery {
    search: string;
    category: string;
    date_from: string;
    date_to: string;
    sort: ExpenseSort;
    direction: SortDirection;
    page: number;
    per_page: PageSize;
}

export const defaultExpenseQuery: ExpenseQuery = {
    search: '',
    category: '',
    date_from: '',
    date_to: '',
    sort: 'expense_date',
    direction: 'desc',
    page: 1,
    per_page: 10,
};

export interface ExpensePaginationMeta {
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
    categories: string[];
}

export interface ExpenseListResponse {
    data: Expense[];
    links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
    meta: ExpensePaginationMeta;
}

export type ExpenseFieldErrors = Partial<Record<keyof ExpenseInput | 'date_from' | 'date_to', string[]>>;
