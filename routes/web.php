<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'ok' => true,
        'service' => 'boxeltigre-api',
        'health' => url('/api/health'),
    ]);
});
