<?php
// database/migrations/xxxx_xx_xx_xxxxxx_create_category_trainer_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('category_trainer', function (Blueprint $table) {
            $table->id();

            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('trainer_id')->constrained()->cascadeOnDelete();

            $table->date('starts_on')->nullable();
            $table->date('ends_on')->nullable();

            $table->timestamps();

            $table->unique(['category_id', 'trainer_id', 'starts_on']);
            $table->index(['trainer_id', 'category_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('category_trainer');
    }
};
