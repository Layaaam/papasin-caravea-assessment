<?php

namespace Tests\Feature;

use App\Models\Expense;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpenseDestroyTest extends TestCase
{
    use RefreshDatabase;

    public function test_deletes_an_existing_expense_redirects_back_and_flashes_success(): void
    {
        $expense = Expense::factory()->create();

        $response = $this->from(route('expenses.index'))->delete(route('expenses.destroy', $expense));

        $response
            ->assertRedirectToRoute('expenses.index')
            ->assertInertiaFlash('success', 'Expense deleted.');
        $this->assertModelMissing($expense);
    }

    public function test_returns_404_for_a_missing_expense(): void
    {
        $response = $this->delete(route('expenses.destroy', 999999));

        $response->assertNotFound();
    }
}
