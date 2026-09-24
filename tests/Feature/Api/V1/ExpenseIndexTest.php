<?php

namespace Tests\Feature\Api\V1;

use App\Models\Expense;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ExpenseIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_paginated_expenses_in_deterministic_default_order(): void
    {
        $older = Expense::factory()->create(['expense_date' => '2026-09-20']);
        $newerFirst = Expense::factory()->create(['expense_date' => '2026-09-24']);
        $newerSecond = Expense::factory()->create(['expense_date' => '2026-09-24']);

        $response = $this->getJson(route('api.v1.expenses.index'));

        $response
            ->assertOk()
            ->assertJsonPath('data.0.id', $newerSecond->id)
            ->assertJsonPath('data.1.id', $newerFirst->id)
            ->assertJsonPath('data.2.id', $older->id)
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonPath('meta.total', 3)
            ->assertJsonStructure([
                'data' => [[
                    'id',
                    'title',
                    'amount',
                    'category',
                    'expense_date',
                    'notes',
                    'created_at',
                    'updated_at',
                ]],
                'links',
                'meta' => ['current_page', 'from', 'last_page', 'per_page', 'to', 'total', 'categories'],
            ]);
    }

    public function test_returns_distinct_categories_as_filter_metadata(): void
    {
        Expense::factory()->create(['category' => 'Pet Care']);
        Expense::factory()->create(['category' => 'Food']);
        Expense::factory()->create(['category' => 'Pet Care']);

        $response = $this->getJson(route('api.v1.expenses.index'));

        $response
            ->assertOk()
            ->assertJsonPath('meta.categories', ['Food', 'Pet Care']);
    }

    #[DataProvider('supportedPageSizes')]
    public function test_paginates_using_each_supported_page_size(int $perPage): void
    {
        Expense::factory()->count($perPage + 1)->create();

        $response = $this->getJson(route('api.v1.expenses.index', ['per_page' => $perPage, 'page' => 2]));

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.per_page', $perPage)
            ->assertJsonPath('meta.total', $perPage + 1);
    }

    /**
     * @return array<string, array{int}>
     */
    public static function supportedPageSizes(): array
    {
        return [
            'ten' => [10],
            'twenty five' => [25],
            'fifty' => [50],
        ];
    }

    public function test_searches_titles_case_insensitively_by_partial_match(): void
    {
        Expense::factory()->create(['title' => 'Team Lunch']);
        Expense::factory()->create(['title' => 'Office Supplies']);

        $response = $this->getJson(route('api.v1.expenses.index', ['search' => ' TEAM ']));

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Team Lunch');
    }

    public function test_filters_by_an_exact_custom_category(): void
    {
        Expense::factory()->create(['title' => 'Dog food', 'category' => 'Pet Care']);
        Expense::factory()->create(['title' => 'Lunch', 'category' => 'Food']);

        $response = $this->getJson(route('api.v1.expenses.index', ['category' => 'Pet Care']));

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Dog food');
    }

    public function test_filters_by_inclusive_expense_date_range(): void
    {
        Expense::factory()->create(['title' => 'Before', 'expense_date' => '2026-09-19']);
        Expense::factory()->create(['title' => 'Start', 'expense_date' => '2026-09-20']);
        Expense::factory()->create(['title' => 'End', 'expense_date' => '2026-09-24']);
        Expense::factory()->create(['title' => 'After', 'expense_date' => '2026-09-25']);

        $response = $this->getJson(route('api.v1.expenses.index', [
            'date_from' => '2026-09-20',
            'date_to' => '2026-09-24',
        ]));

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.title', 'End')
            ->assertJsonPath('data.1.title', 'Start');
    }

    /**
     * @param  array<string, string>  $firstAttributes
     * @param  array<string, string>  $secondAttributes
     */
    #[DataProvider('sortCases')]
    public function test_sorts_by_supported_fields_and_directions(
        string $sort,
        string $direction,
        array $firstAttributes,
        array $secondAttributes,
        string $expectedFirstTitle,
    ): void {
        Expense::factory()->create($firstAttributes);
        Expense::factory()->create($secondAttributes);

        $response = $this->getJson(route('api.v1.expenses.index', [
            'sort' => $sort,
            'direction' => $direction,
        ]));

        $response
            ->assertOk()
            ->assertJsonPath('data.0.title', $expectedFirstTitle);
    }

    /**
     * @return array<string, array{string, string, array<string, string>, array<string, string>, string}>
     */
    public static function sortCases(): array
    {
        return [
            'title ascending' => ['title', 'asc', ['title' => 'Alpha'], ['title' => 'Zulu'], 'Alpha'],
            'title descending' => ['title', 'desc', ['title' => 'Alpha'], ['title' => 'Zulu'], 'Zulu'],
            'amount ascending' => ['amount', 'asc', ['title' => 'Lower', 'amount' => '10.00'], ['title' => 'Higher', 'amount' => '20.00'], 'Lower'],
            'amount descending' => ['amount', 'desc', ['title' => 'Lower', 'amount' => '10.00'], ['title' => 'Higher', 'amount' => '20.00'], 'Higher'],
            'category ascending' => ['category', 'asc', ['title' => 'Food item', 'category' => 'Food'], ['title' => 'Utilities item', 'category' => 'Utilities'], 'Food item'],
            'category descending' => ['category', 'desc', ['title' => 'Food item', 'category' => 'Food'], ['title' => 'Utilities item', 'category' => 'Utilities'], 'Utilities item'],
            'date ascending' => ['expense_date', 'asc', ['title' => 'Older', 'expense_date' => '2026-09-20'], ['title' => 'Newer', 'expense_date' => '2026-09-24'], 'Older'],
            'date descending' => ['expense_date', 'desc', ['title' => 'Older', 'expense_date' => '2026-09-20'], ['title' => 'Newer', 'expense_date' => '2026-09-24'], 'Newer'],
        ];
    }

    #[DataProvider('invalidQueryCases')]
    public function test_returns_422_for_invalid_query_parameters(string $field, mixed $value): void
    {
        $response = $this->getJson(route('api.v1.expenses.index', [$field => $value]));

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors($field);
    }

    /**
     * @return array<string, array{string, mixed}>
     */
    public static function invalidQueryCases(): array
    {
        return [
            'search too long' => ['search', str_repeat('a', 256)],
            'category too long' => ['category', str_repeat('a', 101)],
            'invalid start date' => ['date_from', '09/24/2026'],
            'invalid end date' => ['date_to', 'tomorrow'],
            'sort injection' => ['sort', 'expense_date; DROP TABLE expenses'],
            'invalid direction' => ['direction', 'sideways'],
            'zero page' => ['page', 0],
            'unsupported page size' => ['per_page', 100],
        ];
    }

    public function test_returns_422_when_start_date_is_after_end_date(): void
    {
        $response = $this->getJson(route('api.v1.expenses.index', [
            'date_from' => '2026-09-25',
            'date_to' => '2026-09-24',
        ]));

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('date_to');
    }
}
