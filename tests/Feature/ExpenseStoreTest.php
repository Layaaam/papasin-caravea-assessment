<?php

namespace Tests\Feature;

use App\Models\Expense;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ExpenseStoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_payload_creates_expense_redirects_back_and_flashes_success(): void
    {
        $this->travelTo('2026-09-24 12:00:00');

        $response = $this->from(route('expenses.index'))->post(route('expenses.store'), [
            'title' => '  Team lunch  ',
            'amount' => '1250.50',
            'category' => '  Food  ',
            'expense_date' => '2026-09-24',
            'notes' => '  Client planning session  ',
        ]);

        $response
            ->assertRedirectToRoute('expenses.index')
            ->assertInertiaFlash('success', 'Expense created.');

        $this->assertDatabaseHas('expenses', [
            'title' => 'Team lunch',
            'amount' => 1250.50,
            'category' => 'Food',
            'notes' => 'Client planning session',
        ]);
        $this->assertSame('2026-09-24', Expense::query()->sole()->expense_date->toDateString());
    }

    public function test_stores_blank_notes_as_null_and_custom_categories_directly(): void
    {
        $this->travelTo('2026-09-24 12:00:00');

        $response = $this->from(route('expenses.index'))->post(route('expenses.store'), $this->validPayload([
            'category' => 'Pet Care',
            'notes' => '   ',
        ]));

        $response->assertRedirectToRoute('expenses.index');
        $this->assertDatabaseHas('expenses', ['category' => 'Pet Care', 'notes' => null]);
    }

    public function test_accepts_documented_text_and_amount_boundaries(): void
    {
        $this->travelTo('2026-09-24 12:00:00');

        $response = $this->from(route('expenses.index'))->post(route('expenses.store'), $this->validPayload([
            'title' => str_repeat('a', 255),
            'amount' => '9999999999.99',
            'category' => str_repeat('b', 100),
            'notes' => str_repeat('c', 2000),
        ]));

        $response->assertRedirectToRoute('expenses.index');
        $this->assertDatabaseCount('expenses', 1);
    }

    public function test_missing_required_fields_redirect_back_with_errors(): void
    {
        $response = $this->from(route('expenses.index'))->post(route('expenses.store'), []);

        $response
            ->assertRedirectToRoute('expenses.index')
            ->assertSessionHasErrors(['title', 'amount', 'category', 'expense_date']);
        $this->assertDatabaseCount('expenses', 0);
    }

    #[DataProvider('invalidPayloadCases')]
    public function test_invalid_expense_values_redirect_back_without_persisting(string $field, mixed $value): void
    {
        $this->travelTo('2026-09-24 12:00:00');

        $response = $this->from(route('expenses.index'))->post(
            route('expenses.store'),
            $this->validPayload([$field => $value]),
        );

        $response
            ->assertRedirectToRoute('expenses.index')
            ->assertSessionHasErrors($field);
        $this->assertDatabaseCount('expenses', 0);
    }

    /** @return array<string, array{string, mixed}> */
    public static function invalidPayloadCases(): array
    {
        return [
            'blank title' => ['title', '   '],
            'title too long' => ['title', str_repeat('a', 256)],
            'zero amount' => ['amount', '0'],
            'negative amount' => ['amount', '-1.00'],
            'non-numeric amount' => ['amount', 'one hundred'],
            'too many decimal places' => ['amount', '1.234'],
            'amount exceeds decimal precision' => ['amount', '10000000000.00'],
            'blank category' => ['category', '   '],
            'category too long' => ['category', str_repeat('a', 101)],
            'invalid date format' => ['expense_date', '09/24/2026'],
            'future expense date' => ['expense_date', '2026-09-25'],
            'notes too long' => ['notes', str_repeat('a', 2001)],
        ];
    }

    public function test_does_not_persist_unexpected_payload_keys(): void
    {
        $this->travelTo('2026-09-24 12:00:00');

        $response = $this->from(route('expenses.index'))->post(route('expenses.store'), $this->validPayload([
            'id' => 999,
            'created_at' => '2000-01-01 00:00:00',
            'unexpected' => 'value',
        ]));

        $response->assertRedirectToRoute('expenses.index');
        $expense = Expense::query()->sole();
        $this->assertNotSame(999, $expense->id);
        $this->assertNotSame('2000-01-01 00:00:00', $expense->created_at?->format('Y-m-d H:i:s'));
    }

    /** @param array<string, mixed> $overrides */
    private function validPayload(array $overrides = []): array
    {
        return array_replace([
            'title' => 'Team lunch',
            'amount' => '1250.00',
            'category' => 'Food',
            'expense_date' => '2026-09-24',
            'notes' => 'Client planning session',
        ], $overrides);
    }
}
