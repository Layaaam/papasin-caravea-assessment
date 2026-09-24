import { describe, expect, it } from 'vitest';

import { expenseQueryParameters } from '@/lib/expense-query';
import { defaultExpenseQuery } from '@/types/expense';

describe('expenseQueryParameters', () => {
    it('omits blank and default values', () => {
        expect(expenseQueryParameters(defaultExpenseQuery)).toEqual({});
    });

    it('trims filters and includes only non-default controls', () => {
        expect(expenseQueryParameters({
            ...defaultExpenseQuery,
            search: ' lunch ',
            category: 'Food',
            sort: 'title',
            direction: 'asc',
            page: 2,
            per_page: 25,
        })).toEqual({
            search: 'lunch',
            category: 'Food',
            sort: 'title',
            direction: 'asc',
            page: 2,
            per_page: 25,
        });
    });
});
