<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Enrollment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'student_id',
        'category_id',
        'starts_on',
        'ends_on',
        'status',

        // ✅ Billing / crédito
        'billing_day',
        'plan_total_cents',
        'installments_count',
    ];

    protected $casts = [
        'starts_on' => 'date',
        'ends_on' => 'date',

        // ✅ Billing / crédito
        'billing_day' => 'integer',
        'plan_total_cents' => 'integer',
        'installments_count' => 'integer',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    // ✅ Cuotas/pensiones generadas para esta matrícula
    public function charges(): HasMany
    {
        return $this->hasMany(Charge::class);
    }
}
