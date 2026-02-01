<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->unsignedTinyInteger('billing_day')->default(5)->after('ends_on'); // 1..28 recomendado
            $table->unsignedInteger('plan_total_cents')->nullable()->after('billing_day'); // total del crédito
            $table->unsignedSmallInteger('installments_count')->nullable()->after('plan_total_cents'); // cuotas
        });
    }

    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropColumn(['billing_day', 'plan_total_cents', 'installments_count']);
        });
    }
};
