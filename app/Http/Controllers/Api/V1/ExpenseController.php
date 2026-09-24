<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ListExpenseRequest;
use App\Http\Requests\Api\V1\StoreExpenseRequest;
use App\Http\Requests\Api\V1\UpdateExpenseRequest;
use App\Http\Resources\Api\V1\ExpenseResource;
use App\Models\Expense;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ExpenseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(ListExpenseRequest $request): AnonymousResourceCollection
    {
        $filters = $request->validated();
        $sort = $filters['sort'] ?? 'expense_date';
        $direction = $filters['direction'] ?? 'desc';

        $expenses = Expense::query()
            ->when(
                $filters['search'] ?? null,
                fn (Builder $query, string $search): Builder => $query->titleContains($search),
            )
            ->when(
                $filters['category'] ?? null,
                fn (Builder $query, string $category): Builder => $query->inCategory($category),
            )
            ->when(
                $filters['date_from'] ?? null,
                fn (Builder $query, string $date): Builder => $query->spentFrom($date),
            )
            ->when(
                $filters['date_to'] ?? null,
                fn (Builder $query, string $date): Builder => $query->spentThrough($date),
            )
            ->orderBy($sort, $direction)
            ->orderBy('id', $direction)
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();

        $categories = Expense::query()
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->values()
            ->all();

        return ExpenseResource::collection($expenses)->additional([
            'meta' => ['categories' => $categories],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreExpenseRequest $request): JsonResponse
    {
        $expense = Expense::query()->create(
            $request->safe()->only(['title', 'amount', 'category', 'expense_date', 'notes']),
        );

        return (new ExpenseResource($expense))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     */
    public function show(Expense $expense): ExpenseResource
    {
        return new ExpenseResource($expense);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateExpenseRequest $request, Expense $expense): ExpenseResource
    {
        $expense->update(
            $request->safe()->only(['title', 'amount', 'category', 'expense_date', 'notes']),
        );

        return new ExpenseResource($expense->refresh());
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Expense $expense): Response
    {
        $expense->delete();

        return response()->noContent();
    }
}
