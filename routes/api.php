<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductCategoryController;
use App\Http\Controllers\Api\StoreOrderController;
use App\Http\Controllers\Api\AttendanceController;

// ✅ Reportes
use App\Http\Controllers\Api\Reports\FinanceReportController;
use App\Http\Controllers\Api\Reports\InstallmentsReportController;
use App\Http\Controllers\Api\Reports\StudentsReportController;
use App\Http\Controllers\Api\Reports\AttendanceReportController;
use App\Http\Controllers\Api\Reports\StoreReportController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Este archivo YA tiene el prefijo /api automáticamente en Laravel.
| NO uses Route::prefix('api') aquí.
|--------------------------------------------------------------------------
*/

// Preflight CORS
Route::options('/{any}', fn () => response()->noContent(204))->where('any', '.*');

// Health
Route::get('/health', fn () => response()->json(['status' => 'ok', 'server' => 'Laravel 12']));

// ---------- PUBLIC STORE ----------
Route::get('/product-categories', [ProductCategoryController::class, 'index']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
Route::post('/store/orders', [StoreOrderController::class, 'storePublic']);

// ✅ ---------- PUBLIC SERVICES / MEMBERSHIPS (SOLO LECTURA) ----------
Route::get('/public/categories', [CategoryController::class, 'publicIndex']);

// ---------- AUTH PUBLIC ----------
Route::post('/auth/login', [AuthController::class, 'login']);

// =======================
// ✅ PROTEGIDAS (Sanctum)
// =======================
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Student self
    Route::get('/student/me', [StudentController::class, 'me']);
    Route::get('/student/attendance', [AttendanceController::class, 'myAttendance']);
    Route::get('/student/payments', [EnrollmentController::class, 'myPayments']);

    // =======================
    // ✅ REPORTES (solo admin)
    // =======================
    Route::middleware(['role:admin'])->prefix('reports')->group(function () {
        Route::get('/finance/summary', [FinanceReportController::class, 'summary']);
        Route::get('/finance/list', [FinanceReportController::class, 'list']);

        Route::get('/installments/summary', [InstallmentsReportController::class, 'summary']);
        Route::get('/installments/list', [InstallmentsReportController::class, 'list']);

        Route::get('/students/summary', [StudentsReportController::class, 'summary']);
        Route::get('/students/list', [StudentsReportController::class, 'list']);

        Route::get('/attendance/summary', [AttendanceReportController::class, 'summary']);
        Route::get('/attendance/list', [AttendanceReportController::class, 'list']);

        Route::get('/store/summary', [StoreReportController::class, 'summary']);
        Route::get('/store/list', [StoreReportController::class, 'list']);
    });

    // =======================
    // Asistencia (admin o controlador)
    // =======================
    Route::middleware(['role:attendance_controller|admin'])->group(function () {
        Route::post('/attendance/scan', [AttendanceController::class, 'scan']);
        Route::get('/attendance/today', [AttendanceController::class, 'today']);
        Route::get('/attendance/history', [AttendanceController::class, 'history']);
    });

    // CRUD admin
    Route::apiResource('students', StudentController::class);
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('enrollments', EnrollmentController::class);

    Route::post('/students/{student}/create-user', [StudentController::class, 'createUser']);

    // Products admin (index/show quedan públicos arriba)
    Route::apiResource('products', ProductController::class)->except(['index', 'show']);
    Route::apiResource('product-categories', ProductCategoryController::class)->only(['store', 'update', 'destroy']);

    // Store admin
    Route::get('/store/orders', [StoreOrderController::class, 'index']);
    Route::get('/store/orders/{storeOrder}', [StoreOrderController::class, 'show']);
    Route::put('/store/orders/{storeOrder}', [StoreOrderController::class, 'update']);

    // Enrollments (credit + pagos)
    Route::prefix('enrollments/{enrollment}')->group(function () {
        Route::post('/credit', [EnrollmentController::class, 'saveCredit']);
        Route::get('/initial-payment', [EnrollmentController::class, 'getInitialPayment']);
        Route::post('/initial-payment', [EnrollmentController::class, 'saveInitialPayment']);
        Route::get('/installments', [EnrollmentController::class, 'installments']);
    });

    Route::post('/installments/{installment}/pay', [EnrollmentController::class, 'payInstallment']);
});
