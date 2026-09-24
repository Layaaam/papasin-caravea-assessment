import { describe, expect, it } from 'vitest';

import { formatExpenseDate, formatPeso } from '@/lib/formatters';

describe('expense formatters', () => {
    it('displays pesos with grouping and two decimal places', () => {
        expect(formatPeso('1250.00')).toBe('₱1,250.00');
        expect(formatPeso('2.50')).toBe('₱2.50');
    });

    it('keeps the expense calendar date independent of the browser timezone', () => {
        expect(formatExpenseDate('2026-09-24')).toBe('Sep 24, 2026');
    });
});
