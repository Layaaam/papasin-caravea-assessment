<?php

namespace Tests\Feature\Api\V1;

use App\Models\Expense;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpenseDestroyTest extends TestCase
{
    use RefreshDatabase;

    public function test_deletes_an_existing_expense_and_returns_204(): void
    {
        $expense = Expense::factory()->create();

        $response = $this->deleteJson(route('api.v1.expenses.destroy', $expense));

        $response->assertNoContent();

        $this->assertModelMissing($expense);
    }

    public function test_returns_404_for_a_missing_expense(): void
    {
        $response = $this->deleteJson(route('api.v1.expenses.destroy', 999999));

        $response->assertNotFound();
    }
}
