<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();

            $table->foreignId('product_id')
                ->constrained('products')
                ->cascadeOnDelete();

            // SKU opcional (recomendado si luego conectas pasarela)
            $table->string('sku', 80)->nullable()->unique();

            // Variantes
            $table->string('size', 30)->nullable();          // S/M/L/XL o "14oz" si lo prefieres
            $table->string('color', 40)->nullable();         // Negro, Naranja, etc.
            $table->unsignedSmallInteger('oz')->nullable();  // 12/14/16 (para guantes)

            // Stock por variante
            $table->integer('stock')->default(0);

            // Precio por variante (si es null, usar products.price)
            $table->decimal('price_override', 10, 2)->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            // Evita duplicados exactos de una variante
            $table->unique(['product_id', 'size', 'color', 'oz'], 'product_variant_unique');
            $table->index(['product_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
