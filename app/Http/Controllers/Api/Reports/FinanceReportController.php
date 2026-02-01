<?php

namespace App\Http\Controllers\Api\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinanceReportController extends Controller
{
    public function summary(Request $request)
    {
        $from = $request->query('from');
        $to   = $request->query('to');
        $categoryId = $request->query('category_id');
        $method = $request->query('method');
        $status = $request->query('status');
        $q = trim((string) $request->query('q', ''));

        // ✅ pagos de cuotas (charges)
        $charges = DB::table('charges')
            ->leftJoin('students', 'students.id', '=', 'charges.student_id')
            ->leftJoin('categories', 'categories.id', '=', 'charges.category_id')
            ->when($from, fn($qq) => $qq->whereDate('charges.paid_on', '>=', $from))
            ->when($to, fn($qq) => $qq->whereDate('charges.paid_on', '<=', $to))
            ->when($categoryId, fn($qq) => $qq->where('charges.category_id', (int)$categoryId))
            ->when($method, fn($qq) => $qq->where('charges.method', $method))
            ->when($status, fn($qq) => $qq->where('charges.status', $status))
            ->when($q !== '', function($qq) use ($q) {
                $qq->where(function($w) use ($q) {
                    $w->where('students.first_name', 'like', "%$q%")
                      ->orWhere('students.last_name', 'like', "%$q%")
                      ->orWhere('students.document_number', 'like', "%$q%")
                      ->orWhere('charges.id', $q)
                      ->orWhere('charges.enrollment_id', $q);
                });
            })
            ->whereNotNull('charges.paid_on');

        $totalPaidCents = (int) $charges->sum(DB::raw('COALESCE(charges.paid_cents, 0)'));
        $paymentsCount  = (int) $charges->count();

        // ✅ pago inicial (enrollment_initial_payments)
        $initial = DB::table('enrollment_initial_payments')
            ->join('enrollments', 'enrollments.id', '=', 'enrollment_initial_payments.enrollment_id')
            ->leftJoin('students', 'students.id', '=', 'enrollments.student_id')
            ->leftJoin('categories', 'categories.id', '=', 'enrollments.category_id')
            ->when($from, fn($qq) => $qq->whereDate('enrollment_initial_payments.paid_on', '>=', $from))
            ->when($to, fn($qq) => $qq->whereDate('enrollment_initial_payments.paid_on', '<=', $to))
            ->when($categoryId, fn($qq) => $qq->where('enrollments.category_id', (int)$categoryId))
            ->when($method, fn($qq) => $qq->where('enrollment_initial_payments.method', $method))
            ->when($q !== '', function($qq) use ($q) {
                $qq->where(function($w) use ($q) {
                    $w->where('students.first_name', 'like', "%$q%")
                      ->orWhere('students.last_name', 'like', "%$q%")
                      ->orWhere('students.document_number', 'like', "%$q%")
                      ->orWhere('enrollment_initial_payments.enrollment_id', $q);
                });
            })
            ->where('enrollment_initial_payments.paid', 1);

        $initialTotalCents = (int) $initial->sum(DB::raw('COALESCE(enrollment_initial_payments.amount_cents, 0)'));
        $initialCount = (int) $initial->count();

        $cards = [
            ['label' => 'Cobrado (Cuotas)', 'value' => 'S/ ' . number_format($totalPaidCents / 100, 2)],
            ['label' => 'Cobrado (Matrículas)', 'value' => 'S/ ' . number_format($initialTotalCents / 100, 2)],
            ['label' => 'Total Cobrado', 'value' => 'S/ ' . number_format(($totalPaidCents + $initialTotalCents) / 100, 2)],
            ['label' => 'Pagos (Cuotas)', 'value' => (string)$paymentsCount],
            ['label' => 'Pagos (Matrículas)', 'value' => (string)$initialCount],
        ];

        return response()->json(['success' => true, 'data' => ['cards' => $cards]]);
    }

    public function list(Request $request)
    {
        $from = $request->query('from');
        $to   = $request->query('to');
        $categoryId = $request->query('category_id');
        $method = $request->query('method');
        $status = $request->query('status');
        $q = trim((string) $request->query('q', ''));

        // Lista unificada: cuotas (charges) + matrículas (initial)
        $charges = DB::table('charges')
            ->leftJoin('students', 'students.id', '=', 'charges.student_id')
            ->leftJoin('categories', 'categories.id', '=', 'charges.category_id')
            ->selectRaw("
                charges.id as id,
                charges.paid_on as paid_on,
                charges.method as method,
                charges.concept as concept,
                charges.amount_cents as amount_cents,
                charges.paid_cents as paid_cents,
                CONCAT(COALESCE(students.first_name,''),' ',COALESCE(students.last_name,'')) as student_name,
                students.document_number as document_number,
                categories.name as category_name,
                charges.enrollment_id as enrollment_id,
                CONCAT('NV-CUOTA-', LPAD(charges.id, 6, '0')) as receipt
            ")
            ->when($from, fn($qq) => $qq->whereDate('charges.paid_on', '>=', $from))
            ->when($to, fn($qq) => $qq->whereDate('charges.paid_on', '<=', $to))
            ->when($categoryId, fn($qq) => $qq->where('charges.category_id', (int)$categoryId))
            ->when($method, fn($qq) => $qq->where('charges.method', $method))
            ->when($status, fn($qq) => $qq->where('charges.status', $status))
            ->when($q !== '', function($qq) use ($q) {
                $qq->where(function($w) use ($q) {
                    $w->where('students.first_name', 'like', "%$q%")
                      ->orWhere('students.last_name', 'like', "%$q%")
                      ->orWhere('students.document_number', 'like', "%$q%")
                      ->orWhere('charges.id', $q)
                      ->orWhere('charges.enrollment_id', $q);
                });
            })
            ->whereNotNull('charges.paid_on');

        $initial = DB::table('enrollment_initial_payments')
            ->join('enrollments', 'enrollments.id', '=', 'enrollment_initial_payments.enrollment_id')
            ->leftJoin('students', 'students.id', '=', 'enrollments.student_id')
            ->leftJoin('categories', 'categories.id', '=', 'enrollments.category_id')
            ->selectRaw("
                enrollment_initial_payments.id as id,
                enrollment_initial_payments.paid_on as paid_on,
                enrollment_initial_payments.method as method,
                'initial' as concept,
                enrollment_initial_payments.amount_cents as amount_cents,
                enrollment_initial_payments.amount_cents as paid_cents,
                CONCAT(COALESCE(students.first_name,''),' ',COALESCE(students.last_name,'')) as student_name,
                students.document_number as document_number,
                categories.name as category_name,
                enrollment_initial_payments.enrollment_id as enrollment_id,
                CONCAT('NV-', LPAD(enrollment_initial_payments.id, 6, '0')) as receipt
            ")
            ->when($from, fn($qq) => $qq->whereDate('enrollment_initial_payments.paid_on', '>=', $from))
            ->when($to, fn($qq) => $qq->whereDate('enrollment_initial_payments.paid_on', '<=', $to))
            ->when($categoryId, fn($qq) => $qq->where('enrollments.category_id', (int)$categoryId))
            ->when($method, fn($qq) => $qq->where('enrollment_initial_payments.method', $method))
            ->when($q !== '', function($qq) use ($q) {
                $qq->where(function($w) use ($q) {
                    $w->where('students.first_name', 'like', "%$q%")
                      ->orWhere('students.last_name', 'like', "%$q%")
                      ->orWhere('students.document_number', 'like', "%$q%")
                      ->orWhere('enrollment_initial_payments.enrollment_id', $q);
                });
            })
            ->where('enrollment_initial_payments.paid', 1);

        // UNION
        $rows = $charges->unionAll($initial)->orderBy('paid_on', 'desc')->limit(500)->get();

        return response()->json(['success' => true, 'data' => ['rows' => $rows]]);
    }
}
