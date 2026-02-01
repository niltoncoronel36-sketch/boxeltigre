<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CategoryUpdateRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'level' => ['nullable', 'string', 'max:40'],

            'min_age' => ['nullable', 'integer', 'min:0', 'max:99'],
            'max_age' => ['nullable', 'integer', 'min:0', 'max:99'],

            'capacity' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'monthly_fee_cents' => ['nullable', 'integer', 'min:0', 'max:999999999'],

            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}