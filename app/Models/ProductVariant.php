<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductVariant extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'product_variants';

    protected $fillable = [
        'product_id',
        'sku',
        'size',
        'color',
        'oz',
        'stock',
        'price_override',
        'is_active',
    ];

    protected $casts = [
        'oz' => 'integer',
        'stock' => 'integer',
        'price_override' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class, 'product_variant_id')
            ->orderBy('sort_order');
    }

    public function getLabelAttribute(): string
    {
        $parts = array_filter([
            $this->size,
            $this->color,
            $this->oz ? ($this->oz . 'oz') : null,
        ]);

        return implode(' / ', $parts);
    }
}
