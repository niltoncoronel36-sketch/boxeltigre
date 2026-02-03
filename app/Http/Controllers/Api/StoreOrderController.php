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

      // ✅ NUEVO: variante (puede ser null si el producto NO tiene variantes)
      'items.*.variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],

      // Mantengo estos por compatibilidad / UI, pero ya no serán la “fuente de verdad”
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

      // ✅ Validar variantes por cada item (si el producto tiene variantes)
      foreach ($data['items'] as $it) {
        $p = $products[(int)$it['product_id']];
        $needsVariant = (int)$p->has_variants === 1;

        if ($needsVariant) {
          if (empty($it['variant_id'])) {
            return response()->json([
              'success' => false,
              'message' => "Falta variant_id para el producto {$p->name}.",
              'data' => null,
            ], 422);
          }

          $belongs = DB::table('product_variants')
            ->where('id', (int)$it['variant_id'])
            ->where('product_id', (int)$p->id)
            ->exists();

          if (!$belongs) {
            return response()->json([
              'success' => false,
              'message' => "La variante seleccionada no pertenece al producto {$p->name}.",
              'data' => null,
            ], 422);
          }
        }
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

          // ✅ guarda variante si aplica
          'product_variant_id' => !empty($it['variant_id']) ? (int)$it['variant_id'] : null,

          'product_name' => $p->name,
          'product_slug' => $p->slug,

          // Mantengo para mostrar bonito en admin/cliente
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
          'product_variant_id' => $it->product_variant_id, // ✅ nuevo
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
   * Cambiar estado / notas / método + aplicar stock en confirmación + revertir en cancelación
   */
  public function update(Request $request, StoreOrder $storeOrder)
  {
    $data = $request->validate([
      'status' => ['nullable', 'in:pending,confirmed,preparing,ready,delivered,cancelled'],
      'payment_method' => ['nullable', 'in:cash,whatsapp,yape,gateway'],
      'notes' => ['nullable', 'string', 'max:2000'],
    ]);

    try {
      DB::transaction(function () use ($storeOrder, $data) {

        // 1) Bloquear pedido
        $order = StoreOrder::query()
          ->where('id', $storeOrder->id)
          ->lockForUpdate()
          ->firstOrFail();

        $newStatus = $data['status'] ?? $order->status;

        // 2) Actualiza campos del pedido
        $order->status = $newStatus;
        if (array_key_exists('payment_method', $data)) {
          $order->payment_method = $data['payment_method'] ?? $order->payment_method;
        }
        if (array_key_exists('notes', $data)) {
          $order->notes = $data['notes'];
        }
        $order->save();

        // 3) Items (incluye variant_id)
        $items = StoreOrderItem::query()
          ->where('store_order_id', $order->id)
          ->get(['product_id', 'product_variant_id', 'qty']);

        // Estados que "consumen" stock
        $consumeStates = ['confirmed', 'preparing', 'ready', 'delivered'];

        // A) DESCUENTA al entrar a un estado de consumo (una sola vez)
        if (in_array($newStatus, $consumeStates, true) && !$order->stock_applied) {

          foreach ($items as $it) {
            $pid = (int)$it->product_id;
            $qty = (int)$it->qty;

            $product = Product::query()
              ->where('id', $pid)
              ->lockForUpdate()
              ->first();

            if (!$product) {
              throw new \Exception("Producto no existe (ID {$pid})");
            }

            if ((int)$product->has_variants === 1) {
              $vid = (int)($it->product_variant_id ?? 0);
              if ($vid <= 0) {
                throw new \Exception("Falta product_variant_id en el item del pedido (producto {$pid}).");
              }

              // Bloquea variante
              $variant = DB::table('product_variants')
                ->where('id', $vid)
                ->where('product_id', $pid)
                ->lockForUpdate()
                ->first();

              if (!$variant) {
                throw new \Exception("Variante inválida (ID {$vid}) para producto {$pid}.");
              }

              $current = (int)($variant->stock ?? 0);
              if ($current < $qty) {
                throw new \Exception("Stock insuficiente en variante (producto {$pid}).");
              }

              DB::table('product_variants')
                ->where('id', $vid)
                ->update(['stock' => $current - $qty]);

            } else {
              // Producto sin variantes: descuenta products.stock
              $current = (int)($product->stock ?? 0);
              if ($current < $qty) {
                throw new \Exception("Stock insuficiente para producto {$pid}.");
              }
              $product->stock = $current - $qty;
              $product->save();
            }
          }

          $order->stock_applied = true;
          $order->stock_applied_at = now();
          $order->save();
        }

        // B) REPONE al cancelar (solo si ya se aplicó antes)
        if ($newStatus === 'cancelled' && $order->stock_applied) {

          foreach ($items as $it) {
            $pid = (int)$it->product_id;
            $qty = (int)$it->qty;

            $product = Product::query()
              ->where('id', $pid)
              ->lockForUpdate()
              ->first();

            if (!$product) continue;

            if ((int)$product->has_variants === 1) {
              $vid = (int)($it->product_variant_id ?? 0);
              if ($vid <= 0) continue;

              $variant = DB::table('product_variants')
                ->where('id', $vid)
                ->where('product_id', $pid)
                ->lockForUpdate()
                ->first();

              if (!$variant) continue;

              $current = (int)($variant->stock ?? 0);

              DB::table('product_variants')
                ->where('id', $vid)
                ->update(['stock' => $current + $qty]);

            } else {
              $product->stock = (int)($product->stock ?? 0) + $qty;
              $product->save();
            }
          }

          $order->stock_applied = false;
          $order->stock_applied_at = null;
          $order->save();
        }
      });

      return response()->json([
        'success' => true,
        'message' => 'Pedido actualizado',
        'data' => ['id' => $storeOrder->id],
      ]);
    } catch (\Throwable $e) {
      return response()->json([
        'success' => false,
        'message' => 'No se pudo actualizar el pedido',
        'error' => $e->getMessage(),
      ], 422);
    }
  }
}
