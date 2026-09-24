<?php

namespace Tests\Feature;

use App\Models\Expense;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpenseUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_payload_updates_expense_redirects_back_and_flashes_success(): void
    {
        $this->travelTo('2026-09-24 12:00:00');
        $expense = Expense::factory()->create(['title' => 'Old title', 'category' => 'Food']);

        $response = $this->from(route('expenses.index'))->put(route('expenses.update', $expense), [
            'title' => '  Updated title  ',
            'amount' => '999.95',
            'category' => '  Pet Care  ',
            'expense_date' => '2026-09-23',
            'notes' => '  Updated notes  ',
        ]);

        $response
            ->assertRedirectToRoute('expenses.index')
            ->assertInertiaFlash('success', 'Expense updated.');
        $this->assertDatabaseHas('expenses', [
            'id' => $expense->id,
            'title' => 'Updated title',
            'amount' => 999.95,
            'category' => 'Pet Care',
            'notes' => 'Updated notes',
        ]);
        $this->assertSame('2026-09-23', $expense->fresh()->expense_date->toDateString());
    }

    public function test_can_switch_a_custom_category_to_a_predefined_category(): void
    {
        $this->travelTo('2026-09-24 12:00:00');
        $expense = Expense::factory()->create(['category' => 'Pet Care']);

        $response = $this->from(route('expenses.index'))->patch(route('expenses.update', $expense), $this->validPayload([
            'category' => 'Food',
        ]));

        $response->assertRedirectToRoute('expenses.index');
        $this->assertDatabaseHas('expenses', ['id' => $expense->id, 'category' => 'Food']);
    }

    public function test_invalid_payload_redirects_back_and_preserves_expense(): void
    {
        $this->travelTo('2026-09-24 12:00:00');
        $expense = Expense::factory()->create(['title' => 'Original title', 'amount' => '100.00']);

        $response = $this->from(route('expenses.index'))->put(route('expenses.update', $expense), $this->validPayload([
            'title' => '',
            'amount' => '1.234',
            'expense_date' => '2026-09-25',
        ]));

        $response
            ->assertRedirectToRoute('expenses.index')
            ->assertSessionHasErrors(['title', 'amount', 'expense_date']);
        $this->assertDatabaseHas('expenses', [
            'id' => $expense->id,
            'title' => 'Original title',
            'amount' => 100.00,
        ]);
    }

    public function test_does_not_update_unexpected_payload_keys(): void
    {
        $this->travelTo('2026-09-24 12:00:00');
        $expense = Expense::factory()->create();
        $originalCreatedAt = $expense->created_at?->format('Y-m-d H:i:s');

        $response = $this->from(route('expenses.index'))->put(route('expenses.update', $expense), $this->validPayload([
            'id' => 999,
            'created_at' => '2000-01-01 00:00:00',
            'unexpected' => 'value',
        ]));

        $response->assertRedirectToRoute('expenses.index');
        $expense->refresh();
        $this->assertNotSame(999, $expense->id);
        $this->assertSame($originalCreatedAt, $expense->created_at?->format('Y-m-d H:i:s'));
    }

    public function test_returns_404_for_a_missing_expense(): void
    {
        $response = $this->put(route('expenses.update', 999999), $this->validPayload());

        $response->assertNotFound();
    }

    /** @param array<string, mixed> $overrides */
    private function validPayload(array $overrides = []): array
    {
        return array_replace([
            'title' => 'Updated expense',
            'amount' => '250.00',
            'category' => 'Utilities',
            'expense_date' => '2026-09-24',
            'notes' => null,
        ], $overrides);
    }
}
