<?php

namespace App\Http\Controllers;

use App\Http\Requests\ListExpenseRequest;
use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(ListExpenseRequest $request): Response|RedirectResponse
    {
        $validated = $request->validated();
        $filters = [
            'search' => $validated['search'] ?? '',
            'category' => $validated['category'] ?? '',
            'date_from' => $validated['date_from'] ?? '',
            'date_to' => $validated['date_to'] ?? '',
            'sort' => $validated['sort'] ?? 'expense_date',
            'direction' => $validated['direction'] ?? 'desc',
            'page' => (int) ($validated['page'] ?? 1),
            'per_page' => (int) ($validated['per_page'] ?? 10),
        ];

        $expenses = Expense::query()
            ->when(
                $filters['search'],
                fn (Builder $query, string $search): Builder => $query->titleContains($search),
            )
            ->when(
                $filters['category'],
                fn (Builder $query, string $category): Builder => $query->inCategory($category),
            )
            ->when(
                $filters['date_from'],
                fn (Builder $query, string $date): Builder => $query->spentFrom($date),
            )
            ->when(
                $filters['date_to'],
                fn (Builder $query, string $date): Builder => $query->spentThrough($date),
            )
            ->orderBy($filters['sort'], $filters['direction'])
            ->orderBy('id', $filters['direction'])
            ->paginate($filters['per_page'])
            ->withQueryString();

        if ($filters['page'] > $expenses->lastPage() && $filters['page'] > 1) {
            return to_route('expenses.index', [
                ...$request->query(),
                'page' => $expenses->lastPage(),
            ]);
        }

        return Inertia::render('expenses/index', [
            'expenses' => fn () => ExpenseResource::collection($expenses),
            'filters' => $filters,
            'categories' => fn (): array => Expense::query()
                ->distinct()
                ->orderBy('category')
                ->pluck('category')
                ->values()
                ->all(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreExpenseRequest $request): RedirectResponse
    {
        Expense::query()->create(
            $request->safe()->only(['title', 'amount', 'category', 'expense_date', 'notes']),
        );

        return Inertia::flash('success', 'Expense created.')->back();
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateExpenseRequest $request, Expense $expense): RedirectResponse
    {
        $expense->update(
            $request->safe()->only(['title', 'amount', 'category', 'expense_date', 'notes']),
        );

        return Inertia::flash('success', 'Expense updated.')->back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Expense $expense): RedirectResponse
    {
        $expense->delete();

        return Inertia::flash('success', 'Expense deleted.')->back();
    }
}
