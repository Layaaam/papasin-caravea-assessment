import { defaultExpenseQuery, type ExpenseQuery } from '@/types/expense';

export function expenseQueryParameters(query: ExpenseQuery): Record<string, string | number> {
    const parameters: Record<string, string | number> = {};

    for (const key of ['search', 'category', 'date_from', 'date_to'] as const) {
        const value = query[key].trim();

        if (value !== '') {
            parameters[key] = value;
        }
    }

    if (query.sort !== defaultExpenseQuery.sort) {
        parameters.sort = query.sort;
    }

    if (query.direction !== defaultExpenseQuery.direction) {
        parameters.direction = query.direction;
    }

    if (query.page !== defaultExpenseQuery.page) {
        parameters.page = query.page;
    }

    if (query.per_page !== defaultExpenseQuery.per_page) {
        parameters.per_page = query.per_page;
    }

    return parameters;
}
