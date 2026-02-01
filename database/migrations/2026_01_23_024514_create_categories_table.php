<?php
// database/migrations/xxxx_xx_xx_xxxxxx_create_categories_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();

            $table->string('name'); // Ej: "Infantil", "Juvenil", "Avanzados"
            $table->string('level')->nullable(); // opcional: básico/intermedio/avanzado

            $table->unsignedSmallInteger('min_age')->nullable();
            $table->unsignedSmallInteger('max_age')->nullable();

            $table->unsignedSmallInteger('capacity')->nullable(); // cupos
            $table->unsignedInteger('monthly_fee_cents')->nullable(); // referencia (cobros reales van en billing)

            $table->enum('status', ['active', 'inactive'])->default('active');

            $table->timestamps();
            $table->softDeletes();

            $table->index(['status']);
            $table->unique(['name', 'level']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
