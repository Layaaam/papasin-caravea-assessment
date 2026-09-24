<?php

namespace Tests\Feature;

use App\Models\Expense;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ExpenseIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_renders_paginated_expenses_in_deterministic_default_order(): void
    {
        $older = Expense::factory()->create(['expense_date' => '2026-09-20']);
        $newerFirst = Expense::factory()->create(['expense_date' => '2026-09-24']);
        $newerSecond = Expense::factory()->create(['expense_date' => '2026-09-24']);

        $response = $this->get(route('expenses.index'));

        $response->assertInertia(fn (Assert $page): Assert => $page
            ->component('expenses/index')
            ->where('expenses.data.0.id', $newerSecond->id)
            ->where('expenses.data.1.id', $newerFirst->id)
            ->where('expenses.data.2.id', $older->id)
            ->where('expenses.meta.current_page', 1)
            ->where('expenses.meta.per_page', 10)
            ->where('expenses.meta.total', 3)
            ->where('filters', [
                'search' => '',
                'category' => '',
                'date_from' => '',
                'date_to' => '',
                'sort' => 'expense_date',
                'direction' => 'desc',
                'page' => 1,
                'per_page' => 10,
            ])
            ->has('expenses.data.0', fn (Assert $expense): Assert => $expense
                ->hasAll(['id', 'title', 'amount', 'category', 'expense_date', 'notes', 'created_at', 'updated_at'])
            ));
    }

    public function test_serializes_complete_expense_details_in_the_list_prop(): void
    {
        $expense = Expense::factory()->create([
            'title' => 'Team lunch',
            'amount' => '1250.00',
            'category' => 'Food',
            'expense_date' => '2026-09-24',
            'notes' => 'Client planning session',
        ]);

        $response = $this->get(route('expenses.index'));

        $response->assertInertia(fn (Assert $page): Assert => $page
            ->where('expenses.data.0.id', $expense->id)
            ->where('expenses.data.0.title', 'Team lunch')
            ->where('expenses.data.0.amount', '1250.00')
            ->where('expenses.data.0.category', 'Food')
            ->where('expenses.data.0.expense_date', '2026-09-24')
            ->where('expenses.data.0.notes', 'Client planning session')
        );
    }

    public function test_returns_distinct_categories_as_a_page_prop(): void
    {
        Expense::factory()->create(['category' => 'Pet Care']);
        Expense::factory()->create(['category' => 'Food']);
        Expense::factory()->create(['category' => 'Pet Care']);

        $response = $this->get(route('expenses.index'));

        $response->assertInertia(fn (Assert $page): Assert => $page
            ->where('categories', ['Food', 'Pet Care'])
        );
    }

    #[DataProvider('supportedPageSizes')]
    public function test_paginates_using_each_supported_page_size(int $perPage): void
    {
        Expense::factory()->count($perPage + 1)->create();

        $response = $this->get(route('expenses.index', ['per_page' => $perPage, 'page' => 2]));

        $response->assertInertia(fn (Assert $page): Assert => $page
            ->has('expenses.data', 1)
            ->where('expenses.meta.current_page', 2)
            ->where('expenses.meta.per_page', $perPage)
            ->where('expenses.meta.total', $perPage + 1)
            ->where('filters.page', 2)
            ->where('filters.per_page', $perPage)
        );
    }

    /** @return array<string, array{int}> */
    public static function supportedPageSizes(): array
    {
        return ['ten' => [10], 'twenty five' => [25], 'fifty' => [50]];
    }

    public function test_searches_titles_case_insensitively_by_partial_match(): void
    {
        Expense::factory()->create(['title' => 'Team Lunch']);
        Expense::factory()->create(['title' => 'Office Supplies']);

        $response = $this->get(route('expenses.index', ['search' => ' TEAM ']));

        $response->assertInertia(fn (Assert $page): Assert => $page
            ->has('expenses.data', 1)
            ->where('expenses.data.0.title', 'Team Lunch')
            ->where('filters.search', 'TEAM')
        );
    }

    public function test_filters_by_custom_category_and_inclusive_date_range(): void
    {
        Expense::factory()->create(['title' => 'Before', 'category' => 'Pet Care', 'expense_date' => '2026-09-19']);
        Expense::factory()->create(['title' => 'Start', 'category' => 'Pet Care', 'expense_date' => '2026-09-20']);
        Expense::factory()->create(['title' => 'End', 'category' => 'Pet Care', 'expense_date' => '2026-09-24']);
        Expense::factory()->create(['title' => 'Other category', 'category' => 'Food', 'expense_date' => '2026-09-22']);

        $response = $this->get(route('expenses.index', [
            'category' => 'Pet Care',
            'date_from' => '2026-09-20',
            'date_to' => '2026-09-24',
        ]));

        $response->assertInertia(fn (Assert $page): Assert => $page
            ->has('expenses.data', 2)
            ->where('expenses.data.0.title', 'End')
            ->where('expenses.data.1.title', 'Start')
        );
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

        $response = $this->get(route('expenses.index', ['sort' => $sort, 'direction' => $direction]));

        $response->assertInertia(fn (Assert $page): Assert => $page
            ->where('expenses.data.0.title', $expectedFirstTitle)
        );
    }

    /** @return array<string, array{string, string, array<string, string>, array<string, string>, string}> */
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
    public function test_redirects_invalid_query_parameters_to_the_canonical_index(string $field, mixed $value): void
    {
        $response = $this->get(route('expenses.index', [$field => $value]));

        $response
            ->assertRedirectToRoute('expenses.index')
            ->assertSessionHasErrors($field);
    }

    /** @return array<string, array{string, mixed}> */
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

    public function test_redirects_when_start_date_is_after_end_date(): void
    {
        $response = $this->get(route('expenses.index', [
            'date_from' => '2026-09-25',
            'date_to' => '2026-09-24',
        ]));

        $response
            ->assertRedirectToRoute('expenses.index')
            ->assertSessionHasErrors('date_to');
    }

    public function test_redirects_an_out_of_range_page_to_the_last_available_page(): void
    {
        Expense::factory()->count(11)->create();

        $response = $this->get(route('expenses.index', ['page' => 3]));

        $response->assertRedirectToRoute('expenses.index', ['page' => 2]);
    }
}
