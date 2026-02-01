<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void
  {
    Schema::create('store_order_items', function (Blueprint $table) {
      $table->id();

      $table->foreignId('store_order_id')
        ->constrained('store_orders')
        ->cascadeOnDelete();

      $table->foreignId('product_id')
        ->nullable()
        ->constrained('products')
        ->nullOnDelete();

      // snapshot (para que no cambie si editas producto)
      $table->string('product_name', 180);
      $table->string('product_slug', 180)->nullable();

      $table->string('size', 30)->nullable();
      $table->string('color', 30)->nullable();
      $table->string('oz', 30)->nullable();

      $table->decimal('unit_price', 10, 2);
      $table->unsignedInteger('qty');
      $table->decimal('line_total', 10, 2);

      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('store_order_items');
  }
};
