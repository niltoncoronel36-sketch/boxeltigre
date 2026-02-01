<?php

namespace App\Http\Controllers\Api\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AttendanceReportController extends Controller
{
    /**
     * GET /api/reports/attendance/summary
     * Filtros: from, to, category_id, q
     */
    public function summary(Request $request)
    {
        $from = $request->query('from');
        $to   = $request->query('to');
        $categoryId = $request->query('category_id');
        $q = trim((string) $request->query('q', ''));

        $base = $this->baseQuery($from, $to, $categoryId, $q);

        $total = (clone $base)->count();

        // Incompletas: sin salida (si existe check_out_time)
        // Si tu tabla no tiene check_out_time, esta parte no rompe: usamos COALESCE en select/list, pero aquí lo calculamos con whereNull.
        $incomplete = (clone $base)->whereNull('attendances.check_out_time')->count();

        $cards = [
            ['label' => 'Registros', 'value' => (string)$total],
            ['label' => 'Incompletas', 'value' => (string)$incomplete, 'hint' => 'sin salida (check_out)'],
        ];

        return response()->json(['success' => true, 'data' => ['cards' => $cards]]);
    }

    /**
     * GET /api/reports/attendance/list
     * Lista asistencia con alumno/categoría.
     */
    public function list(Request $request)
    {
        $from = $request->query('from');
        $to   = $request->query('to');
        $categoryId = $request->query('category_id');
        $q = trim((string) $request->query('q', ''));

        $rows = $this->baseQuery($from, $to, $categoryId, $q)
            ->selectRaw("
                attendances.id as id,
                attendances.date as date,
                attendances.check_in_time as check_in_time,
                attendances.check_out_time as check_out_time,
                CONCAT(COALESCE(students.first_name,''),' ',COALESCE(students.last_name,'')) as student_name,
                students.document_number as document_number,
                categories.name as category_name
            ")
            ->orderBy('attendances.date', 'desc')
            ->orderBy('attendances.check_in_time', 'desc')
            ->limit(900)
            ->get();

        return response()->json(['success' => true, 'data' => ['rows' => $rows]]);
    }

    /**
     * Query base con joins para filtrar por categoría y buscar por alumno/DNI.
     *
     * Join:
     * attendances.user_id -> students.user_id
     * students.id -> enrollments.student_id (matrícula activa si existe)
     * enrollments.category_id -> categories.id
     */
    private function baseQuery(?string $from, ?string $to, $categoryId, string $q)
    {
        // Subquery: matrícula activa por alumno (si hay varias, toma la más reciente por starts_on)
        $latest = DB::table('enrollments as e')
            ->selectRaw('e.student_id, MAX(COALESCE(e.starts_on, "0000-00-00")) as max_starts')
            ->whereIn('e.status', ['active', 'paused']) // se consideran vigentes
            ->groupBy('e.student_id');

        return DB::table('attendances')
            ->leftJoin('students', 'students.user_id', '=', 'attendances.user_id')
            ->leftJoinSub($latest, 'le', function ($join) {
                $join->on('le.student_id', '=', 'students.id');
            })
            ->leftJoin('enrollments as e', function ($join) {
                $join->on('e.student_id', '=', 'students.id')
                    ->on(DB::raw('COALESCE(e.starts_on, "0000-00-00")'), '=', 'le.max_starts');
            })
            ->leftJoin('categories', 'categories.id', '=', 'e.category_id')
            ->when($from, fn($qq) => $qq->whereDate('attendances.date', '>=', $from))
            ->when($to, fn($qq) => $qq->whereDate('attendances.date', '<=', $to))
            ->when($categoryId, fn($qq) => $qq->where('e.category_id', (int)$categoryId))
            ->when($q !== '', function ($qq) use ($q) {
                $qq->where(function ($w) use ($q) {
                    $w->where('students.first_name', 'like', "%$q%")
                      ->orWhere('students.last_name', 'like', "%$q%")
                      ->orWhere('students.document_number', 'like', "%$q%")
                      ->orWhere('attendances.user_id', $q);
                });
            });
    }
}
