<?php

namespace App\Http\Controllers\Api\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InstallmentsReportController extends Controller
{
    /**
     * GET /api/reports/installments/summary
     * Filtros: from, to, category_id, method, status, q
     * - from/to: por vencimiento (due_on) por defecto
     * - si quieres filtrar por pago, usa status=paid y paid_on se usa en la lista (ver list)
     */
    public function summary(Request $request)
    {
        $from = $request->query('from');
        $to   = $request->query('to');
        $categoryId = $request->query('category_id');
        $method = $request->query('method');
        $status = $request->query('status'); // paid / unpaid / partial / overdue (si lo usas)
        $q = trim((string) $request->query('q', ''));

        // ✅ Principal: charges (cuotas)
        $base = DB::table('charges')
            ->leftJoin('students', 'students.id', '=', 'charges.student_id')
            ->leftJoin('categories', 'categories.id', '=', 'charges.category_id')
            ->where('charges.concept', 'installment') // si tus cuotas usan otro concept, ajusta aquí
            ->when($from, fn ($qq) => $qq->whereDate('charges.due_on', '>=', $from))
            ->when($to, fn ($qq) => $qq->whereDate('charges.due_on', '<=', $to))
            ->when($categoryId, fn ($qq) => $qq->where('charges.category_id', (int) $categoryId))
            ->when($method, fn ($qq) => $qq->where('charges.method', $method))
            ->when($status, function ($qq) use ($status) {
                // Si tienes status en charges:
                // paid/unpaid/partial
                if ($status === 'overdue') {
                    $qq->whereDate('charges.due_on', '<', now()->toDateString())
                       ->where(function ($w) {
                           $w->whereNull('charges.paid_on')
                             ->orWhereRaw('COALESCE(charges.paid_cents,0) < COALESCE(charges.amount_cents,0)');
                       });
                    return;
                }
                $qq->where('charges.status', $status);
            })
            ->when($q !== '', function ($qq) use ($q) {
                $qq->where(function ($w) use ($q) {
                    $w->where('students.first_name', 'like', "%$q%")
                      ->orWhere('students.last_name', 'like', "%$q%")
                      ->orWhere('students.document_number', 'like', "%$q%")
                      ->orWhere('charges.enrollment_id', $q)
                      ->orWhere('charges.id', $q);
                });
            });

        // Conteos por estado (asumiendo status existe)
        $total = (clone $base)->count();

        $paid = (clone $base)->where('charges.status', 'paid')->count();
        $partial = (clone $base)->where('charges.status', 'partial')->count();
        $unpaid = (clone $base)->where('charges.status', 'unpaid')->count();

        // Vencidas: due_on < hoy y no pagadas totalmente
        $overdue = (clone $base)
            ->whereDate('charges.due_on', '<', now()->toDateString())
            ->where(function ($w) {
                $w->whereNull('charges.paid_on')
                  ->orWhereRaw('COALESCE(charges.paid_cents,0) < COALESCE(charges.amount_cents,0)');
            })
            ->count();

        // Deuda total
        $debtCents = (int) (clone $base)
            ->selectRaw('SUM(GREATEST(0, COALESCE(charges.amount_cents,0) - COALESCE(charges.paid_cents,0))) as debt')
            ->value('debt');

        $cards = [
            ['label' => 'Total cuotas', 'value' => (string) $total],
            ['label' => 'Pagadas', 'value' => (string) $paid],
            ['label' => 'Parciales', 'value' => (string) $partial],
            ['label' => 'Pendientes', 'value' => (string) $unpaid],
            ['label' => 'Vencidas', 'value' => (string) $overdue, 'hint' => 'due_on < hoy y falta pagar'],
            ['label' => 'Deuda total', 'value' => 'S/ ' . number_format($debtCents / 100, 2)],
        ];

        return response()->json(['success' => true, 'data' => ['cards' => $cards]]);
    }

    /**
     * GET /api/reports/installments/list
     * Lista cuotas con deuda y días de atraso.
     */
    public function list(Request $request)
    {
        $from = $request->query('from');
        $to   = $request->query('to');
        $categoryId = $request->query('category_id');
        $method = $request->query('method');
        $status = $request->query('status');
        $q = trim((string) $request->query('q', ''));

        $rows = DB::table('charges')
            ->leftJoin('students', 'students.id', '=', 'charges.student_id')
            ->leftJoin('categories', 'categories.id', '=', 'charges.category_id')
            ->where('charges.concept', 'installment') // ajusta si tu concept es otro
            ->when($from, fn ($qq) => $qq->whereDate('charges.due_on', '>=', $from))
            ->when($to, fn ($qq) => $qq->whereDate('charges.due_on', '<=', $to))
            ->when($categoryId, fn ($qq) => $qq->where('charges.category_id', (int) $categoryId))
            ->when($method, fn ($qq) => $qq->where('charges.method', $method))
            ->when($status, function ($qq) use ($status) {
                if ($status === 'overdue') {
                    $qq->whereDate('charges.due_on', '<', now()->toDateString())
                       ->where(function ($w) {
                           $w->whereNull('charges.paid_on')
                             ->orWhereRaw('COALESCE(charges.paid_cents,0) < COALESCE(charges.amount_cents,0)');
                       });
                    return;
                }
                $qq->where('charges.status', $status);
            })
            ->when($q !== '', function ($qq) use ($q) {
                $qq->where(function ($w) use ($q) {
                    $w->where('students.first_name', 'like', "%$q%")
                      ->orWhere('students.last_name', 'like', "%$q%")
                      ->orWhere('students.document_number', 'like', "%$q%")
                      ->orWhere('charges.enrollment_id', $q)
                      ->orWhere('charges.id', $q);
                });
            })
            ->selectRaw("
                charges.id as id,
                charges.due_on as due_on,
                charges.status as status,
                charges.amount_cents as amount_cents,
                charges.paid_cents as paid_cents,
                charges.paid_on as paid_on,
                charges.method as method,
                charges.enrollment_id as enrollment_id,
                CONCAT(COALESCE(students.first_name,''),' ',COALESCE(students.last_name,'')) as student_name,
                students.document_number as document_number,
                categories.name as category_name,
                CASE
                  WHEN charges.due_on IS NULL THEN NULL
                  WHEN DATE(charges.due_on) >= CURDATE() THEN 0
                  ELSE DATEDIFF(CURDATE(), DATE(charges.due_on))
                END as days_late
            ")
            ->orderBy('charges.due_on', 'asc')
            ->limit(800)
            ->get();

        return response()->json(['success' => true, 'data' => ['rows' => $rows]]);
    }
}
