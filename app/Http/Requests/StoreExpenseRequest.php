<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'gt:0', 'decimal:0,2', 'max:9999999999.99'],
            'category' => ['required', 'string', 'max:100'],
            'expense_date' => ['required', Rule::date()->format('Y-m-d')->todayOrBefore()],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $notes = $this->input('notes');

        $this->merge([
            'title' => $this->trimmedInput('title'),
            'category' => $this->trimmedInput('category'),
            'notes' => is_string($notes) && trim($notes) === '' ? null : $this->trimmedInput('notes'),
        ]);
    }

    private function trimmedInput(string $key): mixed
    {
        $value = $this->input($key);

        return is_string($value) ? trim($value) : $value;
    }
}
