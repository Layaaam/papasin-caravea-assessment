<?php

namespace Tests\Feature\Api\V1;

use App\Models\Expense;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpenseShowTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_an_existing_expense_with_stable_serialization(): void
    {
        $expense = Expense::factory()->create([
            'title' => 'Team lunch',
            'amount' => '1250.00',
            'category' => 'Food',
            'expense_date' => '2026-09-24',
            'notes' => 'Client planning session',
        ]);

        $response = $this->getJson(route('api.v1.expenses.show', $expense));

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $expense->id)
            ->assertJsonPath('data.title', 'Team lunch')
            ->assertJsonPath('data.amount', '1250.00')
            ->assertJsonPath('data.category', 'Food')
            ->assertJsonPath('data.expense_date', '2026-09-24')
            ->assertJsonPath('data.notes', 'Client planning session')
            ->assertJsonStructure(['data' => [
                'id',
                'title',
                'amount',
                'category',
                'expense_date',
                'notes',
                'created_at',
                'updated_at',
            ]]);
    }

    public function test_returns_404_for_a_missing_expense(): void
    {
        $response = $this->getJson(route('api.v1.expenses.show', 999999));

        $response->assertNotFound();
    }
}
