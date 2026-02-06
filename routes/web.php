<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
| Solo rutas que devuelven vistas (SPA).
| Importante: NO interceptar /api/*
|--------------------------------------------------------------------------
*/

// Home SPA (si tienes la vista app.blade.php)
Route::get('/', fn () => view('app'));

// Ruta especial SPA (tu attendance)
Route::middleware(['auth:sanctum', 'role:attendance_controller|admin'])->group(function () {
    Route::get('/attendance', fn () => view('app'));
});

/**
 * ✅ SPA fallback PERO sin tocar /api/*
 * - Esto evita que /api/... caiga aquí.
 */
Route::get('/{any}', fn () => view('app'))
    ->where('any', '^(?!api).*$');
