<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * ✅ API login (Bearer token con Sanctum) - SIN sesiones
     * POST /api/auth/login
     * Body: { email: "dni o email", password: "..." }
     */
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'string'],   // ✅ DNI o email (tu frontend manda "email")
            'password' => ['required', 'string'],
        ]);

        $login = trim((string) $data['email']);
        $password = (string) $data['password'];

        // 🔁 Ajusta aquí según tus columnas reales:
        // - Si tienes columna "dni", déjalo
        // - Si NO tienes "dni", elimina ese orWhere
        $user = User::query()
            ->where('email', $login)
            ->orWhere('dni', $login)
            ->first();

        if (!$user || !Hash::check($password, (string) $user->password)) {
            // Respuesta tipo validation (como tu versión anterior)
            throw ValidationException::withMessages([
                'email' => ['Credenciales inválidas.'],
            ]);
        }

        // ✅ Opcional: borrar tokens anteriores del usuario (para 1 sesión activa)
        // $user->tokens()->delete();

        // ✅ Crear token Sanctum (requiere HasApiTokens en User)
        $token = $user->createToken('web')->plainTextToken;

        // ✅ Roles desde role_user + roles
        $roles = DB::table('role_user')
            ->join('roles', 'roles.id', '=', 'role_user.role_id')
            ->where('role_user.user_id', $user->id)
            ->select('roles.id', 'roles.key', 'roles.name')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Login OK',
            'data' => [
                'token' => $token,
                'user' => $user,
                'roles' => $roles,
            ],
        ]);
    }

    /**
     * ✅ /api/auth/me (auth:sanctum)
     */
    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $roles = DB::table('role_user')
            ->join('roles', 'roles.id', '=', 'role_user.role_id')
            ->where('role_user.user_id', $user->id)
            ->select('roles.id', 'roles.key', 'roles.name')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Me',
            'data' => [
                'user' => $user,
                'roles' => $roles,
            ],
        ]);
    }

    /**
     * ✅ /api/auth/logout (auth:sanctum)
     * Borra el token actual
     */
    public function logout(Request $request)
    {
        $user = $request->user();

        if ($user) {
            $user->currentAccessToken()?->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout OK',
            'data' => null,
        ]);
    }
}
