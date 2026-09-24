<?php

namespace Database\Seeders;

use App\Models\Expense;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ExpenseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach ($this->expenses() as $expense) {
            Expense::query()->updateOrCreate(
                ['title' => $expense['title']],
                $expense,
            );
        }
    }

    /**
     * @return list<array{title: string, amount: string, category: string, expense_date: string, notes: string}>
     */
    private function expenses(): array
    {
        return [
            [
                'title' => 'September apartment rent',
                'amount' => '18500.00',
                'category' => 'Housing',
                'expense_date' => '2026-09-01',
                'notes' => 'Monthly rent for the apartment, paid through online bank transfer.',
            ],
            [
                'title' => 'Weekly groceries',
                'amount' => '3248.75',
                'category' => 'Food',
                'expense_date' => '2026-09-23',
                'notes' => 'Fresh produce, rice, meat, and household staples for the week.',
            ],
            [
                'title' => 'Electricity bill',
                'amount' => '2864.40',
                'category' => 'Utilities',
                'expense_date' => '2026-09-18',
                'notes' => 'Meralco bill for the August to September billing period.',
            ],
            [
                'title' => 'Water bill',
                'amount' => '742.15',
                'category' => 'Utilities',
                'expense_date' => '2026-09-17',
                'notes' => 'Monthly water service payment for the apartment.',
            ],
            [
                'title' => 'Fiber internet plan',
                'amount' => '1699.00',
                'category' => 'Utilities',
                'expense_date' => '2026-09-15',
                'notes' => 'Monthly home fiber subscription used for work and personal browsing.',
            ],
            [
                'title' => 'Mobile prepaid load',
                'amount' => '599.00',
                'category' => 'Utilities',
                'expense_date' => '2026-09-14',
                'notes' => 'Thirty-day mobile data, call, and text package.',
            ],
            [
                'title' => 'Fuel refill',
                'amount' => '2500.00',
                'category' => 'Transportation',
                'expense_date' => '2026-09-21',
                'notes' => 'Full tank refill for commuting and weekend errands.',
            ],
            [
                'title' => 'Grab ride to client meeting',
                'amount' => '438.00',
                'category' => 'Transportation',
                'expense_date' => '2026-09-16',
                'notes' => 'Ride from home to the client office in Makati during heavy rain.',
            ],
            [
                'title' => 'Beep card reload',
                'amount' => '500.00',
                'category' => 'Transportation',
                'expense_date' => '2026-09-08',
                'notes' => 'Stored-value reload for regular train and bus commutes.',
            ],
            [
                'title' => 'Car preventive maintenance',
                'amount' => '4850.00',
                'category' => 'Transportation',
                'expense_date' => '2026-08-29',
                'notes' => 'Oil change, filter replacement, and basic safety inspection.',
            ],
            [
                'title' => 'Prescription refill',
                'amount' => '1285.50',
                'category' => 'Healthcare',
                'expense_date' => '2026-09-12',
                'notes' => 'One-month refill of maintenance medicine from the local pharmacy.',
            ],
            [
                'title' => 'Dental cleaning',
                'amount' => '1500.00',
                'category' => 'Healthcare',
                'expense_date' => '2026-08-22',
                'notes' => 'Routine dental cleaning and oral health checkup.',
            ],
            [
                'title' => 'Vitamins and first-aid supplies',
                'amount' => '890.25',
                'category' => 'Healthcare',
                'expense_date' => '2026-08-14',
                'notes' => 'Daily vitamins, bandages, antiseptic, and pain reliever restock.',
            ],
            [
                'title' => 'Family dinner',
                'amount' => '2350.00',
                'category' => 'Food',
                'expense_date' => '2026-09-20',
                'notes' => 'Dinner for four at a Filipino restaurant after a family gathering.',
            ],
            [
                'title' => 'Client lunch meeting',
                'amount' => '1875.50',
                'category' => 'Food',
                'expense_date' => '2026-09-10',
                'notes' => 'Lunch with the project team to review the next delivery milestone.',
            ],
            [
                'title' => 'Coffee beans and filters',
                'amount' => '680.00',
                'category' => 'Food',
                'expense_date' => '2026-09-06',
                'notes' => 'Locally roasted coffee beans and paper filters for home brewing.',
            ],
            [
                'title' => 'Online Laravel course',
                'amount' => '2490.00',
                'category' => 'Education',
                'expense_date' => '2026-09-05',
                'notes' => 'Self-paced course covering Laravel testing and API development.',
            ],
            [
                'title' => 'Technical book purchase',
                'amount' => '745.00',
                'category' => 'Education',
                'expense_date' => '2026-08-18',
                'notes' => 'Reference book on practical software architecture and maintainable code.',
            ],
            [
                'title' => 'School supplies',
                'amount' => '876.25',
                'category' => 'Education',
                'expense_date' => '2026-08-03',
                'notes' => 'Notebooks, pens, folders, and printing materials for the semester.',
            ],
            [
                'title' => 'Laptop stand',
                'amount' => '1299.00',
                'category' => 'Shopping',
                'expense_date' => '2026-09-03',
                'notes' => 'Adjustable aluminum stand for a more comfortable home workstation.',
            ],
            [
                'title' => 'Running shoes',
                'amount' => '3495.00',
                'category' => 'Shopping',
                'expense_date' => '2026-08-09',
                'notes' => 'Replacement running shoes for regular morning exercise.',
            ],
            [
                'title' => 'Movie night tickets',
                'amount' => '700.00',
                'category' => 'Entertainment',
                'expense_date' => '2026-09-13',
                'notes' => 'Two cinema tickets for a weekend movie night.',
            ],
            [
                'title' => 'Streaming subscription',
                'amount' => '399.00',
                'category' => 'Entertainment',
                'expense_date' => '2026-09-02',
                'notes' => 'Monthly family streaming plan renewal.',
            ],
            [
                'title' => 'Dog vaccination',
                'amount' => '950.00',
                'category' => 'Pet Care',
                'expense_date' => '2026-08-26',
                'notes' => 'Annual vaccination and wellness check at the neighborhood veterinary clinic.',
            ],
            [
                'title' => 'Condominium association dues',
                'amount' => '2200.00',
                'category' => 'Housing',
                'expense_date' => '2026-08-01',
                'notes' => 'Monthly association dues covering building security and common-area maintenance.',
            ],
        ];
    }
}
