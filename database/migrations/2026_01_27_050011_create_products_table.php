<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            $table->foreignId('product_category_id')
                ->nullable()
                ->constrained('product_categories')
                ->nullOnDelete();

            $table->string('name', 160);
            $table->string('slug', 190)->unique();

            $table->string('brand', 120)->nullable();
            $table->text('description')->nullable();

            // Precio base (si una variante no tiene price_override, usa este)
            $table->decimal('price', 10, 2);
            $table->decimal('compare_at_price', 10, 2)->nullable();

            $table->string('currency', 3)->default('PEN');

            // Si el producto usa variantes (talla/color/oz)
            $table->boolean('has_variants')->default(true);

            // Stock para productos sin variantes (si algún día lo necesitas)
            $table->integer('stock')->default(0);

            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'product_category_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
