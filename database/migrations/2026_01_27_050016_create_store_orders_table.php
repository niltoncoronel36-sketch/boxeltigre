<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void
  {
    Schema::create('store_orders', function (Blueprint $table) {
      $table->id();

      $table->string('code', 30)->unique(); // TIG-000001
      $table->string('customer_name', 120)->nullable();
      $table->string('customer_phone', 30);
      $table->string('customer_email', 120)->nullable();

      $table->string('payment_method', 20)->default('whatsapp'); // cash|whatsapp|yape|gateway
      $table->string('status', 20)->default('pending'); // pending|confirmed|preparing|ready|delivered|cancelled

      $table->decimal('subtotal', 10, 2)->default(0);
      $table->decimal('shipping', 10, 2)->default(0);
      $table->decimal('total', 10, 2)->default(0);
      $table->string('currency', 8)->default('PEN');

      $table->text('notes')->nullable();

      $table->timestamps();
      $table->softDeletes();

      $table->index(['status', 'payment_method']);
      $table->index(['customer_phone']);
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('store_orders');
  }
};
