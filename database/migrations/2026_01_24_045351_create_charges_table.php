<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('charges', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('enrollment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();

            $table->string('concept', 50)->default('installment'); // cuota
            $table->date('period_start'); // 2026-01-01 (mes del cargo)
            $table->date('due_on'); // fecha de cobro (ej 2026-02-05)

            $table->unsignedInteger('amount_cents');
            $table->unsignedInteger('paid_cents')->default(0);

            $table->enum('status', ['unpaid', 'partial', 'paid', 'void'])->default('unpaid');

            $table->timestamps();
            $table->softDeletes();

            $table->index(['student_id', 'status', 'due_on']);
            $table->index(['enrollment_id', 'period_start']);
            $table->unique(['enrollment_id', 'concept', 'period_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('charges');
    }
};
