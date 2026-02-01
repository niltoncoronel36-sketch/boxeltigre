<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1) Agregar is_active (si no existe)
        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('emergency_contact_phone');
            }
        });

        // 2) Copiar data desde status -> is_active
        // active => 1, inactive => 0
        if (Schema::hasColumn('students', 'status')) {
            DB::table('students')->update([
                'is_active' => DB::raw("CASE WHEN status = 'inactive' THEN 0 ELSE 1 END"),
            ]);
        }

        // 3) Dropear la columna status
        Schema::table('students', function (Blueprint $table) {
            if (Schema::hasColumn('students', 'status')) {
                $table->dropColumn('status');
            }
        });
    }

    public function down(): void
    {
        // 1) Recrear status (si no existe)
        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'status')) {
                $table->enum('status', ['active', 'inactive'])->default('active')->after('emergency_contact_phone');
            }
        });

        // 2) Copiar data inversa desde is_active -> status
        // 1 => active, 0 => inactive
        if (Schema::hasColumn('students', 'is_active')) {
            DB::table('students')->update([
                'status' => DB::raw("CASE WHEN is_active = 0 THEN 'inactive' ELSE 'active' END"),
            ]);
        }

        // 3) Dropear is_active
        Schema::table('students', function (Blueprint $table) {
            if (Schema::hasColumn('students', 'is_active')) {
                $table->dropColumn('is_active');
            }
        });
    }
};
