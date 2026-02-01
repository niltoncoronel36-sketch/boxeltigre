<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void
  {
    Schema::create('enrollment_installments', function (Blueprint $table) {
      $table->id();

      $table->foreignId('enrollment_id')
        ->constrained('enrollments')
        ->cascadeOnDelete();

      $table->unsignedInteger('idx'); // 1..N
      $table->date('due_on');
      $table->unsignedBigInteger('amount_cents');

      $table->enum('status', ['pending', 'paid'])->default('pending');
      $table->date('paid_on')->nullable();
      $table->enum('method', ['cash', 'card', 'yape', 'plin', 'transfer'])->nullable();

      $table->timestamps();
      $table->softDeletes();

      $table->unique(['enrollment_id', 'idx']);
      $table->index(['enrollment_id', 'status']);
      $table->index(['enrollment_id', 'due_on']);
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('enrollment_installments');
  }
};
