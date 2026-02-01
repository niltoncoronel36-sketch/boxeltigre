<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Charge extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'student_id',
        'enrollment_id',
        'category_id',
        'concept',
        'period_start',
        'due_on',
        'amount_cents',
        'paid_cents',
        'status',

        // ✅ NUEVOS
        'paid_on',
        'method',
    ];

    protected $casts = [
        'period_start' => 'date',
        'due_on' => 'date',

        // ✅ NUEVO
        'paid_on' => 'date',
    ];

    public function student(): BelongsTo { return $this->belongsTo(Student::class); }
    public function enrollment(): BelongsTo { return $this->belongsTo(Enrollment::class); }
    public function category(): BelongsTo { return $this->belongsTo(Category::class); }
}
