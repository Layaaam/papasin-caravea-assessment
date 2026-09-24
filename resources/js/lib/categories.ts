export const predefinedCategories = [
    'Food',
    'Transportation',
    'Housing',
    'Utilities',
    'Healthcare',
    'Entertainment',
    'Shopping',
    'Education',
] as const;

export function isPredefinedCategory(category: string): boolean {
    return predefinedCategories.some((value) => value === category);
}

export function availableCategories(storedCategories: string[]): string[] {
    return [...new Set([...predefinedCategories, ...storedCategories])].sort((left, right) => left.localeCompare(right));
}
