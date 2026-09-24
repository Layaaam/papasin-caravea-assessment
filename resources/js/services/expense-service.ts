import type { Expense, ExpenseFieldErrors, ExpenseInput, ExpenseListResponse, ExpenseQuery } from '@/types/expense';

const expenseEndpoint = '/api/v1/expenses';

interface ExpenseResponse {
    data: Expense;
}

interface ErrorResponse {
    message?: string;
    errors?: ExpenseFieldErrors;
}

export class ExpenseServiceError extends Error {
    constructor(
        message: string,
        public readonly status: number | null,
        public readonly errors: ExpenseFieldErrors = {},
    ) {
        super(message);
        this.name = 'ExpenseServiceError';
    }
}

export function serializeExpenseQuery(query: ExpenseQuery): string {
    const parameters = new URLSearchParams();

    for (const key of ['search', 'category', 'date_from', 'date_to'] as const) {
        const value = query[key].trim();

        if (value !== '') {
            parameters.set(key, value);
        }
    }

    parameters.set('sort', query.sort);
    parameters.set('direction', query.direction);
    parameters.set('page', String(query.page));
    parameters.set('per_page', String(query.per_page));

    return parameters.toString();
}

async function readJson(response: Response): Promise<unknown> {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    let response: Response;

    try {
        response = await fetch(path, {
            ...init,
            headers: {
                Accept: 'application/json',
                ...init?.headers,
            },
        });
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw error;
        }

        throw new ExpenseServiceError('Unable to reach the server. Please try again.', null);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    const body = await readJson(response);

    if (!response.ok) {
        const errorBody = body !== null && typeof body === 'object' ? (body as ErrorResponse) : {};
        const fallback = response.status === 404 ? 'This expense could not be found.' : 'The request could not be completed.';

        throw new ExpenseServiceError(errorBody.message ?? fallback, response.status, errorBody.errors ?? {});
    }

    if (body === null) {
        throw new ExpenseServiceError('The server returned an invalid response.', response.status);
    }

    return body as T;
}

export const expenseService = {
    list(query: ExpenseQuery, signal?: AbortSignal): Promise<ExpenseListResponse> {
        return request<ExpenseListResponse>(`${expenseEndpoint}?${serializeExpenseQuery(query)}`, { signal });
    },

    async show(id: number, signal?: AbortSignal): Promise<Expense> {
        const response = await request<ExpenseResponse>(`${expenseEndpoint}/${id}`, { signal });
        return response.data;
    },

    async create(input: ExpenseInput): Promise<Expense> {
        const response = await request<ExpenseResponse>(expenseEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        });
        return response.data;
    },

    async update(id: number, input: ExpenseInput): Promise<Expense> {
        const response = await request<ExpenseResponse>(`${expenseEndpoint}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        });
        return response.data;
    },

    remove(id: number): Promise<void> {
        return request<void>(`${expenseEndpoint}/${id}`, { method: 'DELETE' });
    },
};
