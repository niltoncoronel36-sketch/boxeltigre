<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StudentStoreRequest;
use App\Http\Requests\StudentUpdateRequest;
use App\Models\Student;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 15);
        $perPage = max(1, min(100, $perPage));

        $search = trim((string) $request->query('search', ''));
        $active = $request->query('active', null); // '1' | '0' | null

        $q = Student::query()
            ->with([
                // ✅ Para mostrar "Categoría activa" en el listado (sin N+1)
                'activeEnrollment:id,student_id,category_id,starts_on,ends_on,status',
                'activeEnrollment.category:id,name,level',
            ]);

        if ($active === '1' || $active === '0') {
            $q->where('is_active', $active === '1');
        }

        if ($search !== '') {
            $q->where(function ($w) use ($search) {
                $w->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('document_number', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $q->orderBy('last_name')->orderBy('first_name');

        return response()->json(
            $q->paginate($perPage)->appends($request->query())
        );
    }

    public function store(StudentStoreRequest $request)
    {
        try {
            $student = Student::create($request->validated());
            return response()->json(['data' => $student], 201);
        } catch (QueryException $e) {
            if ((int)($e->errorInfo[1] ?? 0) === 1062) {
                return response()->json([
                    'message' => 'Documento ya registrado.',
                    'errors' => ['document_number' => ['Documento ya registrado.']],
                ], 422);
            }
            throw $e;
        }
    }

    public function show(Student $student)
    {
        // ✅ también lo devolvemos en el detalle
        return response()->json([
            'data' => $student->load([
                'activeEnrollment:id,student_id,category_id,starts_on,ends_on,status',
                'activeEnrollment.category:id,name,level',
            ]),
        ]);
    }

    public function update(StudentUpdateRequest $request, Student $student)
    {
        try {
            $student->fill($request->validated());
            $student->save();

            return response()->json(['data' => $student]);
        } catch (QueryException $e) {
            if ((int)($e->errorInfo[1] ?? 0) === 1062) {
                return response()->json([
                    'message' => 'Documento ya registrado.',
                    'errors' => ['document_number' => ['Documento ya registrado.']],
                ], 422);
            }
            throw $e;
        }
    }

    public function destroy(Student $student)
    {
        $student->delete();
        return response()->json(['ok' => true]);
    }

    public function createUser(Student $student)
    {
        if ($student->user_id) {
            return response()->json([
                'message' => 'Este alumno ya tiene usuario.',
            ], 422);
        }

        $dni = trim((string) ($student->document_number ?? ''));

        if ($dni === '') {
            return response()->json([
                'message' => 'El alumno no tiene DNI/documento para crear usuario.',
                'errors' => ['document_number' => ['Falta document_number']],
            ], 422);
        }

        // ✅ sin dominio: guardamos DNI en users.email
        if (User::where('email', $dni)->exists()) {
            return response()->json([
                'message' => 'Ya existe un usuario con este DNI.',
                'errors' => ['email' => ['Duplicado (DNI ya usado como usuario).']],
            ], 422);
        }

        $user = User::create([
            'name' => trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? '')),
            'email' => $dni,                 // usuario = DNI
            'dni' => $dni,                   // ✅ AHORA SÍ se replica
            'password' => Hash::make($dni),  // contraseña = DNI
        ]);


        // 2. ASIGNAR ROL "STUDENT"
        $roleStudent = Role::where('key', 'student')->first();
        if ($roleStudent) {
            DB::table('role_user')->updateOrInsert(
                ['user_id' => $user->id, 'role_id' => $roleStudent->id],
                ['created_at' => now(), 'updated_at' => now()]
            );
        }

        // 3. Vincular alumno con usuario
        $student->user_id = $user->id;
        $student->save();

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $dni, // solo para front
                ],
            ]
        ], 201);
    }


    public function me(Request $request)
    {
        $user = $request->user();

        // alumno vinculado a este usuario
        $student = Student::where('user_id', $user->id)
            ->with([
                'activeEnrollment:id,student_id,category_id,starts_on,ends_on,status',
                'activeEnrollment.category:id,name,level',
            ])
            ->first();

        if (!$student) {
            return response()->json([
                'message' => 'Alumno no encontrado'
            ], 404);
        }

        return response()->json([
            'data' => $student,
        ]);
    }

}