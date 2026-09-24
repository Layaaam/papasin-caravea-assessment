const pesoIntegerFormatter = new Intl.NumberFormat('en-PH', { maximumFractionDigits: 0 });
const calendarDateFormatter = new Intl.DateTimeFormat('en-PH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
});

const manilaDateFormatter = new Intl.DateTimeFormat('en-PH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Manila',
});

export function formatPeso(amount: string): string {
    const [integer = '0', fraction = '00'] = amount.split('.');

    return `₱${pesoIntegerFormatter.format(Number(integer))}.${fraction.padEnd(2, '0')}`;
}

export function formatExpenseDate(date: string): string {
    return calendarDateFormatter.format(new Date(`${date}T00:00:00Z`));
}

export function getManilaCalendarDate(date = new Date()): string {
    const parts = manilaDateFormatter.formatToParts(date);
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;

    if (!year || !month || !day) {
        throw new Error('Unable to determine the current Manila calendar date.');
    }

    return `${year}-${month}-${day}`;
}
