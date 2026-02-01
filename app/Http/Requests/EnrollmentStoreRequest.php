<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EnrollmentStoreRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        // Si no mandan starts_on, lo normalizamos para que la validación de ends_on funcione
        if (!$this->filled('starts_on')) {
            $this->merge(['starts_on' => now()->toDateString()]);
        }

        // Si crean ended y no mandan ends_on, por defecto hoy (mismo comportamiento que tu controller)
        if ($this->input('status') === 'ended' && !$this->filled('ends_on')) {
            $this->merge(['ends_on' => now()->toDateString()]);
        }
    }

    public function rules(): array
    {
        return [
            'student_id'  => ['required', 'integer', 'exists:students,id'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],

            // Más estricto (tu frontend manda YYYY-MM-DD)
            'starts_on' => ['required', 'date_format:Y-m-d'],
            'ends_on'   => ['nullable', 'date_format:Y-m-d', 'after_or_equal:starts_on'],

            'status' => ['sometimes', Rule::in(['active', 'paused', 'ended'])],
        ];
    }
}
