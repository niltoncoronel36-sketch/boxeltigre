<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Requiere doctrine/dbal para ->change()
            // composer require doctrine/dbal
            $table->string('email', 120)->nullable()->change();
        });

        // Si ya existe el unique, no lo toques.
        // Si quieres asegurarlo con nombre fijo, descomenta:
        /*
        Schema::table('students', function (Blueprint $table) {
            $table->unique(['document_type', 'document_number'], 'students_doc_unique');
        });
        */
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // vuelve a string default (255)
            $table->string('email')->nullable()->change();
        });

        // Si activaste el unique con nombre fijo arriba, puedes dropearlo aquí:
        /*
        Schema::table('students', function (Blueprint $table) {
            $table->dropUnique('students_doc_unique');
        });
        */
    }
};
