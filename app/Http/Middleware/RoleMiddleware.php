<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string $roles)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        // role:admin|attendance_controller  (o role:admin,attendance_controller)
        $allowed = preg_split('/[|,]/', $roles) ?: [];
        $allowed = array_values(array_filter(array_map('trim', $allowed)));

        // Asegúrate que tu User tenga relación roles()
        $hasRole = $user->roles()->whereIn('key', $allowed)->exists();

        if (! $hasRole) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        return $next($request);
    }
}
