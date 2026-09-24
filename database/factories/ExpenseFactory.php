<?php

namespace Database\Factories;

use App\Models\Expense;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Expense>
 */
class ExpenseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(3),
            'amount' => fake()->randomFloat(2, 1, 50_000),
            'category' => fake()->randomElement([
                'Food',
                'Transportation',
                'Housing',
                'Utilities',
                'Healthcare',
                'Entertainment',
                'Shopping',
                'Education',
                'Pet Care',
            ]),
            'expense_date' => fake()->dateTimeBetween('-1 year')->format('Y-m-d'),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
