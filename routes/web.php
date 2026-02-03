<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
| Aquí van solo rutas que devuelven vistas (SPA) o páginas.
| NO pongas rutas /api aquí.
|--------------------------------------------------------------------------
*/

// Si tu app es SPA (React), normalmente devuelves la misma vista
Route::get('/', fn () => view('app'));

// Ruta especial (como la tenías)
Route::middleware(['auth:sanctum', 'role:attendance_controller|admin'])->group(function () {
    Route::get('/attendance', fn () => view('app'));
});

// SPA fallback: cualquier otra ruta -> la vista de tu app
Route::get('/{any}', fn () => view('app'))->where('any', '.*');
