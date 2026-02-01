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
  ];

  public function items()
  {
    return $this->hasMany(StoreOrderItem::class, 'store_order_id');
  }
}
