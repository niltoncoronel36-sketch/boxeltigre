<?php

namespace App\Http\Controllers\Api\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class StoreReportController extends Controller
{
    public function summary(Request $request)
    {
        [$q, $from, $to, $status, $method] = $this->filters($request);

        $query = $this->baseOrdersQuery($from, $to, $status, $method, $q);

        // total pedidos
        $ordersCount = (clone $query)->count(DB::raw('DISTINCT store_orders.id'));

        // total vendido
        $sumExpr = $this->orderTotalExpr();
        $totalCents = (int) (clone $query)->selectRaw("SUM($sumExpr) as total")->value('total');

        // tickets promedio
        $avg = $ordersCount > 0 ? $totalCents / $ordersCount : 0;

        $cards = [
            ['label' => 'Pedidos', 'value' => (string)$ordersCount],
            ['label' => 'Total vendido', 'value' => 'S/ ' . number_format($totalCents / 100, 2)],
            ['label' => 'Ticket promedio', 'value' => 'S/ ' . number_format($avg / 100, 2)],
        ];

        return response()->json(['success' => true, 'data' => ['cards' => $cards]]);
    }

    public function list(Request $request)
    {
        [$q, $from, $to, $status, $method] = $this->filters($request);

        $query = $this->baseOrdersQuery($from, $to, $status, $method, $q);

        $sumExpr = $this->orderTotalExpr();

        $rows = $query
            ->selectRaw("
                store_orders.id as order_id,
                store_orders.code as code,
                " . ($this->hasColumn('store_orders', 'created_at') ? "store_orders.created_at as created_at," : "NULL as created_at,") . "
                " . ($this->hasColumn('store_orders', 'status') ? "store_orders.status as status," : "NULL as status,") . "
                " . ($this->hasColumn('store_orders', 'payment_method') ? "store_orders.payment_method as payment_method," : "NULL as payment_method,") . "
                store_orders.customer_name as customer_name,
                store_orders.customer_phone as customer_phone,
                ($sumExpr) as total_cents
            ")
            ->groupBy('store_orders.id', 'store_orders.code', 'store_orders.customer_name', 'store_orders.customer_phone')
            ->when($this->hasColumn('store_orders', 'created_at'), fn($qq) => $qq->groupBy('store_orders.created_at'))
            ->when($this->hasColumn('store_orders', 'status'), fn($qq) => $qq->groupBy('store_orders.status'))
            ->when($this->hasColumn('store_orders', 'payment_method'), fn($qq) => $qq->groupBy('store_orders.payment_method'))
            ->orderBy(
                $this->hasColumn('store_orders', 'created_at') ? 'store_orders.created_at' : 'store_orders.id',
                'desc'
            )
            ->limit(800)
            ->get();

        return response()->json(['success' => true, 'data' => ['rows' => $rows]]);
    }

    // ------------------------
    // Helpers
    // ------------------------

    private function filters(Request $request): array
    {
        $q = trim((string) $request->query('q', ''));
        $from = $request->query('from');
        $to = $request->query('to');
        $status = $request->query('status'); // pending/paid/delivered/cancelled (según tu sistema)
        $method = $request->query('method'); // payment_method
        return [$q, $from, $to, $status, $method];
    }

    private function baseOrdersQuery(?string $from, ?string $to, $status, $method, string $q)
    {
        // si no existe total_cents en store_orders, intentamos calcular con items
        $needsItemsJoin = !$this->hasColumn('store_orders', 'total_cents');

        $query = DB::table('store_orders');

        if ($needsItemsJoin) {
            // intentamos unir items para calcular total
            if (Schema::hasTable('store_order_items')) {
                $query->leftJoin('store_order_items as soi', 'soi.store_order_id', '=', 'store_orders.id');
            }
        }

        // filtros por fecha (created_at)
        if ($this->hasColumn('store_orders', 'created_at')) {
            $query->when($from, fn($qq) => $qq->whereDate('store_orders.created_at', '>=', $from))
                  ->when($to, fn($qq) => $qq->whereDate('store_orders.created_at', '<=', $to));
        }

        // status (si existe)
        if ($status && $this->hasColumn('store_orders', 'status')) {
            $query->where('store_orders.status', $status);
        }

        // método (payment_method en store_orders)
        if ($method && $this->hasColumn('store_orders', 'payment_method')) {
            $query->where('store_orders.payment_method', $method);
        }

        // búsqueda
        if ($q !== '') {
            $query->where(function ($w) use ($q) {
                $w->where('store_orders.code', 'like', "%$q%")
                  ->orWhere('store_orders.customer_name', 'like', "%$q%")
                  ->orWhere('store_orders.customer_phone', 'like', "%$q%")
                  ->orWhere('store_orders.customer_email', 'like', "%$q%");
            });
        }

        return $query;
    }

    /**
     * Expr SQL para total_cents:
     * - si store_orders.total_cents existe, lo usa
     * - si no, intenta calcular:
     *    1) SUM(soi.total_cents) si existe
     *    2) SUM(soi.qty * soi.unit_price_cents) si existe
     *    3) 0
     */
    private function orderTotalExpr(): string
    {
        if ($this->hasColumn('store_orders', 'total_cents')) {
            return "COALESCE(store_orders.total_cents, 0)";
        }

        // fallback desde items
        $hasTotal = $this->hasColumn('store_order_items', 'total_cents');
        $hasQty = $this->hasColumn('store_order_items', 'qty');
        $hasUnit = $this->hasColumn('store_order_items', 'unit_price_cents');

        if ($hasTotal) {
            return "COALESCE(SUM(soi.total_cents), 0)";
        }

        if ($hasQty && $hasUnit) {
            return "COALESCE(SUM(COALESCE(soi.qty,0) * COALESCE(soi.unit_price_cents,0)), 0)";
        }

        return "0";
    }

    private function hasColumn(string $table, string $col): bool
    {
        try {
            return Schema::hasColumn($table, $col);
        } catch (\Throwable $e) {
            return false;
        }
    }
}
