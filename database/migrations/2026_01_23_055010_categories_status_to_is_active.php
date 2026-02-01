<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1) Agregar is_active
        Schema::table('categories', function (Blueprint $table) {
            if (!Schema::hasColumn('categories', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('monthly_fee_cents');
            }
        });

        // 2) Copiar status -> is_active
        if (Schema::hasColumn('categories', 'status')) {
            DB::table('categories')->update([
                'is_active' => DB::raw("CASE WHEN status = 'inactive' THEN 0 ELSE 1 END"),
            ]);
        }

        // 3) Level: evitar NULL para que unique(name, level) funcione como esperas
        // Si tienes registros con level NULL, los pasamos a 'general'
        if (Schema::hasColumn('categories', 'level')) {
            DB::table('categories')->whereNull('level')->update(['level' => 'general']);
        }

        // 4) Hacer level NOT NULL con default (requiere DBAL para ->change() en MySQL)
        // composer require doctrine/dbal
        Schema::table('categories', function (Blueprint $table) {
            if (Schema::hasColumn('categories', 'level')) {
                $table->string('level', 40)->default('general')->change();
            }
        });

        // 5) Dropear status
        Schema::table('categories', function (Blueprint $table) {
            if (Schema::hasColumn('categories', 'status')) {
                $table->dropColumn('status');
            }
        });
    }

    public function down(): void
    {
        // 1) Recrear status
        Schema::table('categories', function (Blueprint $table) {
            if (!Schema::hasColumn('categories', 'status')) {
                $table->enum('status', ['active', 'inactive'])->default('active')->after('monthly_fee_cents');
            }
        });

        // 2) Copiar is_active -> status
        if (Schema::hasColumn('categories', 'is_active')) {
            DB::table('categories')->update([
                'status' => DB::raw("CASE WHEN is_active = 0 THEN 'inactive' ELSE 'active' END"),
            ]);
        }

        // 3) Dropear is_active
        Schema::table('categories', function (Blueprint $table) {
            if (Schema::hasColumn('categories', 'is_active')) {
                $table->dropColumn('is_active');
            }
        });

        // level lo dejamos como estaba (string), no lo revertimos a nullable para no romper data
    }
};
