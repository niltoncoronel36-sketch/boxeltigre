<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EnrollmentUpdateRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    protected function prepareForValidation(): void
    {
        // Si cambian a ended y no mandan ends_on, por defecto hoy (igual que en controller)
        if ($this->input('status') === 'ended' && !$this->filled('ends_on')) {
            $this->merge(['ends_on' => now()->toDateString()]);
        }
    }

    public function rules(): array
    {
        return [
            // En update puede venir o no
            'starts_on' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'ends_on'   => ['sometimes', 'nullable', 'date_format:Y-m-d'],

            'status' => ['sometimes', Rule::in(['active', 'paused', 'ended'])],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($v) {
            // Si mandan ends_on, debe ser >= starts_on efectivo (el del request o el del enrollment)
            if ($this->filled('ends_on')) {
                $enrollment = $this->route('enrollment');
                $startsOn = $this->filled('starts_on')
                    ? $this->input('starts_on')
                    : optional($enrollment?->starts_on)->toDateString();

                if ($startsOn && $this->input('ends_on') < $startsOn) {
                    $v->errors()->add('ends_on', 'La fecha fin debe ser mayor o igual a la fecha inicio.');
                }
            }
        });
    }
}
