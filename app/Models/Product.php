<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'products';

    protected $fillable = [
        'product_category_id',
        'name',
        'slug',
        'brand',
        'description',
        'price',
        'compare_at_price',
        'currency',
        'has_variants',
        'stock',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'compare_at_price' => 'decimal:2',
        'has_variants' => 'boolean',
        'is_active' => 'boolean',
        'stock' => 'integer',
    ];

    public function category()
    {
        return $this->belongsTo(ProductCategory::class, 'product_category_id');
    }

    public function variants()
    {
        return $this->hasMany(ProductVariant::class, 'product_id');
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class, 'product_id')
            ->orderBy('sort_order');
    }

    public function primaryImage()
    {
        return $this->hasOne(ProductImage::class, 'product_id')
            ->where('is_primary', true);
    }

    public function getTotalStockAttribute(): int
    {
        if ($this->has_variants) {
            return (int) $this->variants()
                ->where('is_active', true)
                ->sum('stock');
        }

        return (int) ($this->stock ?? 0);
    }

    public function getDisplayPriceAttribute(): string
    {
        if ($this->has_variants) {
            $min = $this->variants()
                ->where('is_active', true)
                ->whereNotNull('price_override')
                ->min('price_override');

            if (!is_null($min)) {
                return number_format((float) $min, 2, '.', '');
            }
        }

        return number_format((float) $this->price, 2, '.', '');
    }
}
