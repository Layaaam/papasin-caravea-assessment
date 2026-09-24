<?php

namespace App\Models;

use Database\Factories\ExpenseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['title', 'amount', 'category', 'expense_date', 'notes'])]
class Expense extends Model
{
    /** @use HasFactory<ExpenseFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'expense_date' => 'date',
        ];
    }

    #[Scope]
    protected function titleContains(Builder $query, string $search): void
    {
        $query->whereLike('title', "%{$search}%", caseSensitive: false);
    }

    #[Scope]
    protected function inCategory(Builder $query, string $category): void
    {
        $query->where('category', $category);
    }

    #[Scope]
    protected function spentFrom(Builder $query, string $date): void
    {
        $query->whereDate('expense_date', '>=', $date);
    }

    #[Scope]
    protected function spentThrough(Builder $query, string $date): void
    {
        $query->whereDate('expense_date', '<=', $date);
    }
}
