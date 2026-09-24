import { Button } from '@/components/ui/button';
import type { ExpensePaginationMeta } from '@/types/expense';

interface ExpensePaginationProps {
    meta: ExpensePaginationMeta;
    onPageChange: (page: number) => void;
}

export function ExpensePagination({ meta, onPageChange }: ExpensePaginationProps) {
    if (meta.total === 0) {
        return null;
    }

    return (
        <nav aria-label="Expense pages" className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
                Showing {meta.from}–{meta.to} of {meta.total} · Page {meta.current_page} of {meta.last_page}
            </p>
            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    disabled={meta.current_page <= 1}
                    onClick={() => onPageChange(meta.current_page - 1)}
                >
                    Previous
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    disabled={meta.current_page >= meta.last_page}
                    onClick={() => onPageChange(meta.current_page + 1)}
                >
                    Next
                </Button>
            </div>
        </nav>
    );
}
