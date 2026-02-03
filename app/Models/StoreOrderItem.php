<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreOrderItem extends Model
{
  protected $table = 'store_order_items';

  protected $fillable = [
    'store_order_id',
    'product_id',

    // ✅ Importante
    'product_variant_id',

    'product_name',
    'product_slug',
    'size',
    'color',
    'oz',
    'unit_price',
    'qty',
    'line_total',
  ];

  protected $casts = [
    'product_id' => 'integer',
    'product_variant_id' => 'integer',
    'unit_price' => 'decimal:2',
    'line_total' => 'decimal:2',
    'qty' => 'integer',
  ];

  public function order()
  {
    return $this->belongsTo(StoreOrder::class, 'store_order_id');
  }

  public function product()
  {
    return $this->belongsTo(Product::class, 'product_id');
  }

  // ✅ Opcional: relación directa a la variante
  public function variant()
  {
    return $this->belongsTo(ProductVariant::class, 'product_variant_id');
  }
}
