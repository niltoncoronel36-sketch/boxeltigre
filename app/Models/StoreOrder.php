<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class StoreOrder extends Model
{
  use SoftDeletes;

  protected $table = 'store_orders';

  protected $fillable = [
    'code',
    'customer_name',
    'customer_phone',
    'customer_email',
    'payment_method',
    'status',

    // ✅ Recomendado (para poder asignarlos si algún día haces update masivo)
    'stock_applied',
    'stock_applied_at',

    'subtotal',
    'shipping',
    'total',
    'currency',
    'notes',
  ];

  protected $casts = [
    'subtotal' => 'decimal:2',
    'shipping' => 'decimal:2',
    'total' => 'decimal:2',

    // ✅ Importante
    'stock_applied' => 'boolean',
    'stock_applied_at' => 'datetime',
  ];

  public function items()
  {
    return $this->hasMany(StoreOrderItem::class, 'store_order_id');
  }
}
