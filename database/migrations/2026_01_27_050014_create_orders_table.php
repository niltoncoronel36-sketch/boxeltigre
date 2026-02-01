<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            // Si el pedido lo hace un usuario del sistema (opcional)
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Datos del cliente (para pedidos públicos)
            $table->string('customer_name', 160);
            $table->string('customer_phone', 40);
            $table->string('customer_email', 160)->nullable();

            // Número visible del pedido (lo generarás en el controlador)
            $table->string('order_number', 40)->unique();

            // Estados
            $table->string('status', 30)->default('pending'); // pending, confirmed, paid, fulfilled, canceled
            $table->string('payment_status', 30)->default('unpaid'); // unpaid, pending, paid, refunded

            // Métodos (cash/whatsapp activos; yape/gateway "pronto")
            $table->string('payment_method', 30)->default('cash'); // cash, whatsapp, yape, gateway

            // Totales
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('shipping', 10, 2)->default(0);
            $table->decimal('total', 10, 2)->default(0);
            $table->string('currency', 3)->default('PEN');

            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'payment_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
