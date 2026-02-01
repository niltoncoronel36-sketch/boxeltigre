<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\EnrollmentStoreRequest;
use App\Http\Requests\EnrollmentUpdateRequest;
use App\Models\Enrollment;
use App\Models\Charge;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class EnrollmentController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max(1, min(100, (int) $request->integer('per_page', 15)));

        $studentId = $request->query('student_id');
        $categoryId = $request->query('category_id');
        $status = $request->query('status'); // active|paused|ended|null

        $q = Enrollment::query()->with([
            'student:id,first_name,last_name,email,phone',
            'category:id,name,level',
        ]);

        if ($studentId) $q->where('student_id', (int) $studentId);
        if ($categoryId) $q->where('category_id', (int) $categoryId);
        if (in_array($status, ['active', 'paused', 'ended'], true)) {
            $q->where('status', $status);
        }

        $q->orderByRaw("FIELD(status,'active','paused','ended')")
          ->orderByDesc('starts_on')
          ->orderByDesc('id');

        return response()->json($q->paginate($perPage)->appends($request->query()));
    }

    public function store(EnrollmentStoreRequest $request)
    {
        $data = $request->validated();

        $data['starts_on'] = $data['starts_on'] ?? now()->toDateString();
        $data['status'] = $data['status'] ?? 'active';

        if ($data['status'] === 'active') {
            $exists = Enrollment::query()
                ->where('student_id', $data['student_id'])
                ->where('category_id', $data['category_id'])
                ->where('status', 'active')
                ->exists();

            if ($exists) {
                return response()->json([
                    'message' => 'El alumno ya tiene una matrícula activa en esta categoría.',
                    'errors' => ['status' => ['Ya existe una matrícula activa.']],
                ], 422);
            }
        }

        if ($data['status'] === 'ended' && empty($data['ends_on'])) {
            $data['ends_on'] = now()->toDateString();
        }

        try {
            $enrollment = Enrollment::create($data)->load(['student', 'category']);
            return response()->json(['data' => $enrollment], 201);
        } catch (QueryException $e) {
            if ((int)($e->errorInfo[1] ?? 0) === 1062) {
                return response()->json([
                    'message' => 'Ya existe una matrícula con esa fecha de inicio para este alumno y categoría.',
                    'errors' => ['starts_on' => ['Duplicado (student_id + category_id + starts_on).']],
                ], 422);
            }
            throw $e;
        }
    }

    public function show(Enrollment $enrollment)
    {
        return response()->json(['data' => $enrollment->load(['student', 'category'])]);
    }

    public function update(EnrollmentUpdateRequest $request, Enrollment $enrollment)
    {
        $data = $request->validated();

        if (array_key_exists('starts_on', $data) && empty($data['starts_on'])) {
            $data['starts_on'] = null;
        }

        if (array_key_exists('starts_on', $data) && $data['starts_on'] === null) {
            $data['starts_on'] = now()->toDateString();
        }

        if (array_key_exists('status', $data) && $data['status'] === 'active') {
            $exists = Enrollment::query()
                ->where('student_id', $enrollment->student_id)
                ->where('category_id', $enrollment->category_id)
                ->where('status', 'active')
                ->where('id', '!=', $enrollment->id)
                ->exists();

            if ($exists) {
                return response()->json([
                    'message' => 'Ya existe otra matrícula activa para este alumno y categoría.',
                    'errors' => ['status' => ['Ya existe otra matrícula activa.']],
                ], 422);
            }
        }

        if (array_key_exists('status', $data) && $data['status'] === 'ended' && empty($data['ends_on'])) {
            $data['ends_on'] = now()->toDateString();
        }

        try {
            $enrollment->fill($data)->save();
            return response()->json(['data' => $enrollment->load(['student', 'category'])]);
        } catch (QueryException $e) {
            if ((int)($e->errorInfo[1] ?? 0) === 1062) {
                return response()->json([
                    'message' => 'Ya existe una matrícula con esa fecha de inicio para este alumno y categoría.',
                    'errors' => ['starts_on' => ['Duplicado (student_id + category_id + starts_on).']],
                ], 422);
            }
            throw $e;
        }
    }

    public function destroy(Enrollment $enrollment)
    {
        $enrollment->delete();
        return response()->json(['ok' => true]);
    }

    /**
     * ✅ Genera o recalcula el plan de cuotas (crédito) para una matrícula.
     * POST /enrollments/{enrollment}/credit
     */
    public function saveCredit(Request $request, Enrollment $enrollment)
    {
        $data = $request->validate([
            'plan_total_cents' => ['required', 'integer', 'min:1'],
            'installments_count' => ['required', 'integer', 'min:1', 'max:36'],
            'billing_day' => ['required', 'integer', 'min:1', 'max:28'],
        ]);

        return DB::transaction(function () use ($data, $enrollment) {

            // 1) Guardar configuración del crédito
            $enrollment->billing_day = (int) $data['billing_day'];
            $enrollment->plan_total_cents = (int) $data['plan_total_cents'];
            $enrollment->installments_count = (int) $data['installments_count'];
            $enrollment->save();

            // 2) Borrar solo cuotas NO pagadas (mantén pagadas)
            Charge::query()
                ->where('enrollment_id', $enrollment->id)
                ->where('concept', 'installment')
                ->whereIn('status', ['unpaid', 'partial'])
                ->delete();

            // 3) Generación de cuotas
            $startsOn = $enrollment->starts_on
                ? Carbon::parse($enrollment->starts_on)->toDateString()
                : now()->toDateString();

            $total = (int) $data['plan_total_cents'];
            $n = (int) $data['installments_count'];
            $billingDay = (int) $data['billing_day'];

            $base = intdiv($total, $n);
            $rem = $total - ($base * $n);

            $start = new \DateTimeImmutable($startsOn . ' 00:00:00');
            $firstDue = $start->setDate((int) $start->format('Y'), (int) $start->format('m'), $billingDay);

            if ($firstDue < $start) {
                $firstDue = $firstDue->modify('+1 month');
            }

            for ($i = 0; $i < $n; $i++) {
                $due = $firstDue->modify("+{$i} month");
                $periodStart = $due->setDate((int) $due->format('Y'), (int) $due->format('m'), 1);

                $amount = $base + ($i < $rem ? 1 : 0);

                Charge::create([
                    'student_id' => $enrollment->student_id,
                    'enrollment_id' => $enrollment->id,
                    'category_id' => $enrollment->category_id,
                    'concept' => 'installment',
                    'period_start' => $periodStart->format('Y-m-d'),
                    'due_on' => $due->format('Y-m-d'),
                    'amount_cents' => $amount,
                    'paid_cents' => 0,
                    'status' => 'unpaid',
                    // ⚠️ si ya creaste columnas:
                    // 'paid_on' => null,
                    // 'method' => null,
                ]);
            }

            return response()->json([
                'data' => [
                    'enrollment' => $enrollment->fresh(),
                    'charges' => Charge::query()
                        ->where('enrollment_id', $enrollment->id)
                        ->where('concept', 'installment')
                        ->orderBy('due_on')
                        ->get(),
                ]
            ], 201);
        });
    }

    /**
     * ✅ Lista cuotas (installments)
     * GET /enrollments/{enrollment}/installments
     */
    public function installments(Enrollment $enrollment)
    {
        $items = Charge::query()
            ->where('enrollment_id', $enrollment->id)
            ->where('concept', 'installment')
            ->orderBy('due_on')
            ->get();

        return response()->json(['data' => $items]);
    }

    /**
     * ✅ Pagar una cuota (total o parcial)
     * POST /installments/{installment}/pay
     */
    public function payInstallment(Request $request, Charge $installment)
    {
        if ($installment->concept !== 'installment') {
            return response()->json(['message' => 'No es una cuota válida.'], 404);
        }

        $data = $request->validate([
            'method' => ['required', 'in:cash,card,yape,plin,transfer'],
            'paid_on' => ['nullable', 'date'],
            'paid_cents' => ['nullable', 'integer', 'min:1'],
        ]);

        return DB::transaction(function () use ($data, $installment) {
            $amount = (int) $installment->amount_cents;
            $already = (int) $installment->paid_cents;
            $remaining = max(0, $amount - $already);

            if ($remaining <= 0) {
                return response()->json(['data' => $installment->fresh()]);
            }

            $pay = isset($data['paid_cents'])
                ? min((int) $data['paid_cents'], $remaining)
                : $remaining;

            $newPaid = $already + $pay;

            $installment->paid_cents = $newPaid;
            $installment->paid_on = $data['paid_on'] ?? now()->toDateString();
            $installment->method = $data['method'];

            $installment->status = ($newPaid >= $amount) ? 'paid' : 'partial';
            $installment->save();

            return response()->json(['data' => $installment->fresh()]);
        });
    }

    /**
     * ✅ Handler único para pago inicial (GET + POST)
     * GET/POST /enrollments/{enrollment}/initial-payment
     */
    public function handleInitialPayment(Request $request, Enrollment $enrollment)
    {
        if ($request->isMethod('get')) {
            $charge = $this->ensureInitialPaymentCharge($enrollment);
            return response()->json(['data' => $charge]);
        }

        $data = $request->validate([
            'paid' => ['required', 'boolean'],
            'method' => ['nullable', 'in:cash,card,yape,plin,transfer'],
            'paid_on' => ['nullable', 'date'],
            // por si tu category no tiene monthly_fee_cents:
            'amount_cents' => ['nullable', 'integer', 'min:1'],
        ]);

        return DB::transaction(function () use ($data, $enrollment) {
            $charge = Charge::query()
                ->where('enrollment_id', $enrollment->id)
                ->where('concept', 'initial_payment')
                ->lockForUpdate()
                ->first();

            if (!$charge) {
                $charge = $this->ensureInitialPaymentCharge($enrollment, (int)($data['amount_cents'] ?? 0));
            }

            if ($data['paid']) {
                $charge->paid_cents = (int) $charge->amount_cents;
                $charge->status = 'paid';
                $charge->paid_on = $data['paid_on'] ?? now()->toDateString();
                $charge->method = $data['method'] ?? 'cash';
            } else {
                $charge->paid_cents = 0;
                $charge->status = 'unpaid';
                $charge->paid_on = null;
                $charge->method = null;
            }

            $charge->save();

            return response()->json(['data' => $charge->fresh()]);
        });
    }

    /**
     * ✅ Compatibilidad (si en algún lugar llamas getInitialPayment)
     */
    public function getInitialPayment(Enrollment $enrollment)
    {
        $req = Request::create('', 'GET');
        return $this->handleInitialPayment($req, $enrollment);
    }

    /**
     * ✅ Compatibilidad (si en algún lugar llamas saveInitialPayment)
     */
    public function saveInitialPayment(Request $request, Enrollment $enrollment)
    {
        $request->setMethod('POST');
        return $this->handleInitialPayment($request, $enrollment);
    }

    /**
     * Crea el cargo initial_payment si no existe.
     */
    private function ensureInitialPaymentCharge(Enrollment $enrollment, int $fallbackAmount = 0): Charge
    {
        $charge = Charge::query()
            ->where('enrollment_id', $enrollment->id)
            ->where('concept', 'initial_payment')
            ->first();

        if ($charge) return $charge;

        $enrollment->loadMissing('category:id,monthly_fee_cents');

        $amount = (int) ($enrollment->category->monthly_fee_cents ?? 0);
        if ($amount <= 0) $amount = $fallbackAmount;

        $starts = Carbon::parse($enrollment->starts_on ?? now()->toDateString());

        return Charge::create([
            'student_id' => $enrollment->student_id,
            'enrollment_id' => $enrollment->id,
            'category_id' => $enrollment->category_id,
            'concept' => 'initial_payment',
            'period_start' => $starts->copy()->startOfMonth()->toDateString(),
            'due_on' => $starts->toDateString(),
            'amount_cents' => $amount,
            'paid_cents' => 0,
            'status' => 'unpaid',
            // ⚠️ si ya existen columnas:
            // 'paid_on' => null,
            // 'method' => null,
        ]);
    }


    public function myPayments(Request $request)
    {
        $user = $request->user();

        // 1) buscar el alumno vinculado al usuario
        $student = \App\Models\Student::query()
            ->where('user_id', $user->id)
            ->first();

        if (!$student) {
            return response()->json([
                'data' => null,
                'message' => 'No tienes alumno vinculado.'
            ], 200);
        }

        // 2) matrícula activa
        $enrollment = Enrollment::query()
            ->with(['category:id,name,level'])
            ->where('student_id', $student->id)
            ->where('status', 'active')
            ->orderByDesc('starts_on')
            ->first();

        if (!$enrollment) {
            return response()->json(['data' => null], 200);
        }

        // 3) cuotas (charges) de esa matrícula
        $installments = Charge::query()
            ->where('enrollment_id', $enrollment->id)
            ->where('concept', 'installment')
            ->orderBy('due_on')
            ->get();

        // 4) totales (en soles)
        $totalCents = (int) $installments->sum('amount_cents');
        $paidCents  = (int) $installments->sum('paid_cents');
        $pendingCents = max(0, $totalCents - $paidCents);

        // 5) map para front (monto en soles)
        $items = $installments->map(function ($c, $idx) {
            return [
                'id' => $c->id,
                'number' => $idx + 1,
                'amount' => round(((int)$c->amount_cents) / 100, 2),
                'paid' => round(((int)$c->paid_cents) / 100, 2),
                'due_date' => $c->due_on,
                'paid_at' => $c->paid_on,
                'status' => $c->status, // unpaid|partial|paid
                'method' => $c->method,
            ];
        });

        return response()->json([
            'data' => [
                'plan' => [
                    'name' => $enrollment->category->name ?? 'Plan',
                    'level' => $enrollment->category->level ?? '',
                ],
                'total' => round($totalCents / 100, 2),
                'paid' => round($paidCents / 100, 2),
                'pending' => round($pendingCents / 100, 2),
                'installments' => $items,
            ],
        ]);
    }

}
