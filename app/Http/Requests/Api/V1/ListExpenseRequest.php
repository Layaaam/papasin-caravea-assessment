<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListExpenseRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:100'],
            'date_from' => ['nullable', Rule::date()->format('Y-m-d')],
            'date_to' => [
                'nullable',
                Rule::date()->format('Y-m-d'),
                Rule::when($this->filled('date_from'), ['after_or_equal:date_from']),
            ],
            'sort' => ['sometimes', Rule::in(['title', 'amount', 'category', 'expense_date'])],
            'direction' => ['sometimes', Rule::in(['asc', 'desc'])],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', Rule::in([10, 25, 50])],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'search' => $this->trimmedQueryValue('search'),
            'category' => $this->trimmedQueryValue('category'),
        ]);
    }

    private function trimmedQueryValue(string $key): mixed
    {
        $value = $this->query($key);

        if (! is_string($value)) {
            return $value;
        }

        $value = trim($value);

        return $value === '' ? null : $value;
    }
}
