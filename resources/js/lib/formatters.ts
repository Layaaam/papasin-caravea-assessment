const pesoIntegerFormatter = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 0 });
const calendarDateFormatter = new Intl.DateTimeFormat('en-PH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
});

export function formatPeso(amount: string): string {
    const [integer = '0', fraction = '00'] = amount.split('.');

    return `₱${pesoIntegerFormatter.format(Number(integer))}.${fraction.padEnd(2, '0')}`;
}

export function formatExpenseDate(date: string): string {
    return calendarDateFormatter.format(new Date(`${date}T00:00:00Z`));
}
