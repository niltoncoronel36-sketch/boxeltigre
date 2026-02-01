<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void
  {
    Schema::create('enrollment_initial_payments', function (Blueprint $table) {
      $table->id();

      $table->foreignId('enrollment_id')
        ->constrained('enrollments')
        ->cascadeOnDelete();

      $table->unsignedBigInteger('amount_cents')->default(0);
      $table->boolean('paid')->default(false);
      $table->date('paid_on')->nullable();
      $table->enum('method', ['cash', 'card', 'yape', 'plin', 'transfer'])->nullable();

      $table->timestamps();
      $table->softDeletes();

      $table->unique('enrollment_id');
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('enrollment_initial_payments');
  }
};
