<?php

namespace Tests\Feature\Api\V1;

use App\Models\Expense;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpenseUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_payload_updates_expense_and_returns_saved_values(): void
    {
        $this->travelTo('2026-09-24 12:00:00');
        $expense = Expense::factory()->create([
            'title' => 'Old title',
            'category' => 'Food',
        ]);

        $response = $this->putJson(route('api.v1.expenses.update', $expense), [
            'title' => '  Updated title  ',
            'amount' => '999.95',
            'category' => '  Pet Care  ',
            'expense_date' => '2026-09-23',
            'notes' => '  Updated notes  ',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.title', 'Updated title')
            ->assertJsonPath('data.amount', '999.95')
            ->assertJsonPath('data.category', 'Pet Care')
            ->assertJsonPath('data.expense_date', '2026-09-23')
            ->assertJsonPath('data.notes', 'Updated notes');

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

        $response = $this->patchJson(route('api.v1.expenses.update', $expense), $this->validPayload([
            'category' => 'Food',
        ]));

        $response
            ->assertOk()
            ->assertJsonPath('data.category', 'Food');

        $this->assertDatabaseHas('expenses', ['id' => $expense->id, 'category' => 'Food']);
    }

    public function test_returns_422_and_preserves_expense_when_payload_is_invalid(): void
    {
        $this->travelTo('2026-09-24 12:00:00');
        $expense = Expense::factory()->create([
            'title' => 'Original title',
            'amount' => '100.00',
        ]);

        $response = $this->putJson(route('api.v1.expenses.update', $expense), $this->validPayload([
            'title' => '',
            'amount' => '1.234',
            'expense_date' => '2026-09-25',
        ]));

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'amount', 'expense_date']);

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

        $response = $this->putJson(route('api.v1.expenses.update', $expense), $this->validPayload([
            'id' => 999,
            'created_at' => '2000-01-01 00:00:00',
            'unexpected' => 'value',
        ]));

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $expense->id)
            ->assertJsonMissingPath('data.unexpected');

        $expense->refresh();

        $this->assertSame($originalCreatedAt, $expense->created_at?->format('Y-m-d H:i:s'));
    }

    public function test_returns_404_for_a_missing_expense(): void
    {
        $response = $this->putJson(route('api.v1.expenses.update', 999999), $this->validPayload());

        $response->assertNotFound();
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
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
