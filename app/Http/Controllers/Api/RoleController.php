<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user || !method_exists($user, 'hasAnyRole') || !$user->hasAnyRole(['admin','supervisor'])) {
            return ApiResponse::error('No autorizado', null, 403);
        }

        // Spatie suele guardar roles en tabla roles(name)
        $roles = DB::table('roles')->orderBy('name')->pluck('name')->values();

        // fallback si no hay tabla roles
        if ($roles->isEmpty()) {
            $roles = collect(['trabajador','supervisor','admin']);
        }

        return ApiResponse::success($roles, 'Roles');
    }
}
