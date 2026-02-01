<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Student extends Model
{
    use SoftDeletes;

    protected $table = 'students';

    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'birthdate',
        'document_type',
        'document_number',
        'phone',
        'email',
        'emergency_contact_name',
        'emergency_contact_phone',
        'is_active',
    ];

    protected $casts = [
        'birthdate' => 'date',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ✅ Todas las matrículas del alumno
    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * ✅ Matrícula “activa actual” (para mostrar “Categoría activa” en el listado)
     * Regla: status=active y (ends_on null o ends_on >= hoy)
     * Devuelve la más reciente por starts_on / id.
     */
    public function activeEnrollment(): HasOne
    {
        $today = now()->toDateString();

        return $this->hasOne(Enrollment::class)
            ->where('status', 'active')
            ->where(function ($q) use ($today) {
                $q->whereNull('ends_on')->orWhere('ends_on', '>=', $today);
            })
            ->orderByDesc('starts_on')
            ->orderByDesc('id');
    }

    public function getFullNameAttribute(): string
    {
        return trim(($this->first_name ?? '') . ' ' . ($this->last_name ?? ''));
    }
}
