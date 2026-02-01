<?php

namespace App\Http\Controllers\Api\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentsReportController extends Controller
{
    /**
     * GET /api/reports/students/summary
     * Filtros: from, to, category_id, status, q
     * - from/to aquí lo usamos sobre enrollments.starts_on (matrícula creada/iniciada)
     */
    public function summary(Request $request)
    {
        $from = $request->query('from');
        $to   = $request->query('to');
        $categoryId = $request->query('category_id');
        $status = $request->query('status'); // active/paused/ended (según enrollments.status)
        $q = trim((string) $request->query('q', ''));

        // Subquery: última matrícula por student_id
        $latest = DB::table('enrollments as e')
            ->selectRaw('e.student_id, MAX(COALESCE(e.starts_on, "0000-00-00")) as max_starts')
            ->groupBy('e.student_id');

        $base = DB::table('students')
            ->leftJoinSub($latest, 'le', function ($join) {
                $join->on('le.student_id', '=', 'students.id');
            })
            ->leftJoin('enrollments as e', function ($join) {
                $join->on('e.student_id', '=', 'students.id')
                    ->on(DB::raw('COALESCE(e.starts_on, "0000-00-00")'), '=', 'le.max_starts');
            })
            ->leftJoin('categories as c', 'c.id', '=', 'e.category_id')
            ->when($from, fn($qq) => $qq->whereDate('e.starts_on', '>=', $from))
            ->when($to, fn($qq) => $qq->whereDate('e.starts_on', '<=', $to))
            ->when($categoryId, fn($qq) => $qq->where('e.category_id', (int)$categoryId))
            ->when($status, fn($qq) => $qq->where('e.status', $status))
            ->when($q !== '', function ($qq) use ($q) {
                $qq->where(function ($w) use ($q) {
                    $w->where('students.first_name', 'like', "%$q%")
                      ->orWhere('students.last_name', 'like', "%$q%")
                      ->orWhere('students.document_number', 'like', "%$q%")
                      ->orWhere('students.email', 'like', "%$q%")
                      ->orWhere('students.phone', 'like', "%$q%");
                });
            });

        $totalStudents = (clone $base)->distinct('students.id')->count('students.id');

        // activos/inactivos (según students.is_active)
        $activeStudents = (clone $base)->where(function ($w) {
            $w->where('students.is_active', 1)->orWhere('students.is_active', true);
        })->distinct('students.id')->count('students.id');

        $inactiveStudents = max(0, $totalStudents - $activeStudents);

        // matrículas por estado (según enrollments.status)
        $enrActive = (clone $base)->where('e.status', 'active')->distinct('students.id')->count('students.id');
        $enrPaused = (clone $base)->where('e.status', 'paused')->distinct('students.id')->count('students.id');
        $enrEnded  = (clone $base)->where('e.status', 'ended')->distinct('students.id')->count('students.id');

        $cards = [
            ['label' => 'Total alumnos', 'value' => (string)$totalStudents],
            ['label' => 'Alumnos activos', 'value' => (string)$activeStudents],
            ['label' => 'Alumnos inactivos', 'value' => (string)$inactiveStudents],
            ['label' => 'Matrícula activa', 'value' => (string)$enrActive],
            ['label' => 'Matrícula pausada', 'value' => (string)$enrPaused],
            ['label' => 'Matrícula finalizada', 'value' => (string)$enrEnded],
        ];

        return response()->json(['success' => true, 'data' => ['cards' => $cards]]);
    }

    /**
     * GET /api/reports/students/list
     * Lista alumnos + su última matrícula (categoría/estado/fechas).
     */
    public function list(Request $request)
    {
        $from = $request->query('from');
        $to   = $request->query('to');
        $categoryId = $request->query('category_id');
        $status = $request->query('status');
        $q = trim((string) $request->query('q', ''));

        // Subquery: última matrícula por student_id (por starts_on)
        $latest = DB::table('enrollments as e')
            ->selectRaw('e.student_id, MAX(COALESCE(e.starts_on, "0000-00-00")) as max_starts')
            ->groupBy('e.student_id');

        $rows = DB::table('students')
            ->leftJoinSub($latest, 'le', function ($join) {
                $join->on('le.student_id', '=', 'students.id');
            })
            ->leftJoin('enrollments as e', function ($join) {
                $join->on('e.student_id', '=', 'students.id')
                    ->on(DB::raw('COALESCE(e.starts_on, "0000-00-00")'), '=', 'le.max_starts');
            })
            ->leftJoin('categories as c', 'c.id', '=', 'e.category_id')
            ->when($from, fn($qq) => $qq->whereDate('e.starts_on', '>=', $from))
            ->when($to, fn($qq) => $qq->whereDate('e.starts_on', '<=', $to))
            ->when($categoryId, fn($qq) => $qq->where('e.category_id', (int)$categoryId))
            ->when($status, fn($qq) => $qq->where('e.status', $status))
            ->when($q !== '', function ($qq) use ($q) {
                $qq->where(function ($w) use ($q) {
                    $w->where('students.first_name', 'like', "%$q%")
                      ->orWhere('students.last_name', 'like', "%$q%")
                      ->orWhere('students.document_number', 'like', "%$q%")
                      ->orWhere('students.email', 'like', "%$q%")
                      ->orWhere('students.phone', 'like', "%$q%");
                });
            })
            ->selectRaw("
                students.id as student_id,
                CONCAT(COALESCE(students.first_name,''),' ',COALESCE(students.last_name,'')) as student_name,
                students.document_number as document_number,
                students.is_active as is_active,
                c.name as category_name,
                e.status as enrollment_status,
                e.starts_on as starts_on,
                e.ends_on as ends_on
            ")
            ->orderBy('students.last_name')
            ->orderBy('students.first_name')
            ->limit(800)
            ->get();

        return response()->json(['success' => true, 'data' => ['rows' => $rows]]);
    }
}
