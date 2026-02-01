<?php
// database/migrations/xxxx_xx_xx_xxxxxx_create_enrollments_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('enrollments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();

            $table->date('starts_on')->nullable();
            $table->date('ends_on')->nullable();

            $table->enum('status', ['active', 'paused', 'ended'])->default('active');

            $table->timestamps();
            $table->softDeletes();

            $table->index(['student_id', 'category_id', 'status']);
            $table->unique(['student_id', 'category_id', 'starts_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};
