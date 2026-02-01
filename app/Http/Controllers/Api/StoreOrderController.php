<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StoreOrder;
use App\Models\StoreOrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StoreOrderController extends Controller
{
  /**
   * ✅ PÚBLICO: POST /api/store/orders
   * Crea pedido desde la tienda pública.
   */
  public function storePublic(Request $request)
  {
    $data = $request->validate([
      'customer_name' => ['nullable', 'string', 'max:120'],
      'customer_phone' => ['required', 'string', 'max:30'],
      'customer_email' => ['nullable', 'email', 'max:120'],

      'payment_method' => ['required', 'in:cash,whatsapp,yape,gateway'],

      'items' => ['required', 'array', 'min:1'],
      'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
      'items.*.qty' => ['required', 'integer', 'min:1', 'max:99'],
      'items.*.size' => ['nullable', 'string', 'max:30'],
      'items.*.color' => ['nullable', 'string', 'max:30'],
      'items.*.oz' => ['nullable', 'string', 'max:30'],

      'notes' => ['nullable', 'string', 'max:2000'],
    ]);

    DB::beginTransaction();
    try {
      $ids = collect($data['items'])->pluck('product_id')->unique()->values();

      // solo productos activos
      $products = Product::query()
        ->whereIn('id', $ids)
        ->where('is_active', true)
        ->get()
        ->keyBy('id');

      if ($products->count() !== $ids->count()) {
        return response()->json([
          'success' => false,
          'message' => 'Hay productos inválidos o inactivos en el pedido.',
          'data' => null,
        ], 422);
      }

      // Crear pedido (code se arma luego con ID)
      $order = StoreOrder::create([
        'code' => 'TMP',
        'customer_name' => $data['customer_name'] ?? null,
        'customer_phone' => $data['customer_phone'],
        'customer_email' => $data['customer_email'] ?? null,
        'payment_method' => $data['payment_method'],
        'status' => 'pending',
        'subtotal' => 0,
        'shipping' => 0,
        'total' => 0,
        'currency' => 'PEN',
        'notes' => $data['notes'] ?? null,
      ]);

      // code final: TIG-000001
      $order->code = 'TIG-' . str_pad((string)$order->id, 6, '0', STR_PAD_LEFT);
      $order->save();

      $subtotal = 0;

      foreach ($data['items'] as $it) {
        $p = $products[(int)$it['product_id']];

        $qty = (int)$it['qty'];
        $unit = (float)$p->price;
        $line = $unit * $qty;
        $subtotal += $line;

        StoreOrderItem::create([
          'store_order_id' => $order->id,
          'product_id' => $p->id,
          'product_name' => $p->name,
          'product_slug' => $p->slug,
          'size' => $it['size'] ?? null,
          'color' => $it['color'] ?? null,
          'oz' => $it['oz'] ?? null,
          'unit_price' => $unit,
          'qty' => $qty,
          'line_total' => $line,
        ]);
      }

      $order->subtotal = $subtotal;
      $order->total = $subtotal; // shipping 0 por ahora
      $order->save();

      DB::commit();

      return response()->json([
        'success' => true,
        'message' => 'Pedido creado',
        'data' => [
          'id' => $order->id,
          'code' => $order->code,
          'status' => $order->status,
          'total' => (float)$order->total,
        ],
      ], 201);
    } catch (\Throwable $e) {
      DB::rollBack();
      return response()->json([
        'success' => false,
        'message' => 'Error al crear pedido',
        'error' => $e->getMessage(),
      ], 500);
    }
  }

  /**
   * ✅ ADMIN: GET /api/store/orders (auth:sanctum)
   */
  public function index(Request $request)
  {
    $q = trim((string)$request->query('q', ''));
    $status = trim((string)$request->query('status', ''));
    $pay = trim((string)$request->query('payment_method', ''));

    $query = StoreOrder::query()->withCount('items')->orderByDesc('id');

    if ($q !== '') {
      $query->where(function ($qq) use ($q) {
        $qq->where('code', 'like', "%{$q}%")
          ->orWhere('customer_phone', 'like', "%{$q}%")
          ->orWhere('customer_name', 'like', "%{$q}%");
      });
    }

    if ($status !== '') $query->where('status', $status);
    if ($pay !== '') $query->where('payment_method', $pay);

    $perPage = (int)$request->query('per_page', 30);
    $perPage = max(1, min(100, $perPage));

    $orders = $query->paginate($perPage);

    $items = $orders->getCollection()->map(function (StoreOrder $o) {
      return [
        'id' => $o->id,
        'code' => $o->code,
        'customer_name' => $o->customer_name,
        'customer_phone' => $o->customer_phone,
        'payment_method' => $o->payment_method,
        'status' => $o->status,
        'total' => (float)$o->total,
        'currency' => $o->currency,
        'items_count' => (int)$o->items_count,
        'created_at' => $o->created_at?->toDateTimeString(),
      ];
    })->values();

    return response()->json([
      'success' => true,
      'message' => 'Pedidos',
      'data' => [
        'items' => $items,
        'pagination' => [
          'current_page' => $orders->currentPage(),
          'per_page' => $orders->perPage(),
          'total' => $orders->total(),
          'last_page' => $orders->lastPage(),
        ],
      ],
    ]);
  }

  /**
   * ✅ ADMIN: GET /api/store/orders/{storeOrder}
   */
  public function show(StoreOrder $storeOrder)
  {
    $storeOrder->load('items');

    return response()->json([
      'success' => true,
      'message' => 'Pedido',
      'data' => [
        'id' => $storeOrder->id,
        'code' => $storeOrder->code,
        'customer_name' => $storeOrder->customer_name,
        'customer_phone' => $storeOrder->customer_phone,
        'customer_email' => $storeOrder->customer_email,
        'payment_method' => $storeOrder->payment_method,
        'status' => $storeOrder->status,
        'subtotal' => (float)$storeOrder->subtotal,
        'total' => (float)$storeOrder->total,
        'currency' => $storeOrder->currency,
        'notes' => $storeOrder->notes,
        'created_at' => $storeOrder->created_at?->toDateTimeString(),
        'items' => $storeOrder->items->map(fn($it) => [
          'id' => $it->id,
          'product_id' => $it->product_id,
          'product_name' => $it->product_name,
          'product_slug' => $it->product_slug,
          'size' => $it->size,
          'color' => $it->color,
          'oz' => $it->oz,
          'unit_price' => (float)$it->unit_price,
          'qty' => (int)$it->qty,
          'line_total' => (float)$it->line_total,
        ])->values(),
      ],
    ]);
  }

  /**
   * ✅ ADMIN: PUT /api/store/orders/{storeOrder}
   * Cambiar estado / notas / método
   */
  public function update(Request $request, StoreOrder $storeOrder)
  {
    $data = $request->validate([
      'status' => ['nullable', 'in:pending,confirmed,preparing,ready,delivered,cancelled'],
      'payment_method' => ['nullable', 'in:cash,whatsapp,yape,gateway'],
      'notes' => ['nullable', 'string', 'max:2000'],
    ]);

    $storeOrder->update([
      'status' => $data['status'] ?? $storeOrder->status,
      'payment_method' => $data['payment_method'] ?? $storeOrder->payment_method,
      'notes' => array_key_exists('notes', $data) ? $data['notes'] : $storeOrder->notes,
    ]);

    return response()->json([
      'success' => true,
      'message' => 'Pedido actualizado',
      'data' => ['id' => $storeOrder->id],
    ]);
  }
}
