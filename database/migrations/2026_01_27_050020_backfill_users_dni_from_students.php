<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement("
            UPDATE users u
            INNER JOIN students s ON s.user_id = u.id
            SET u.dni = s.document_number
            WHERE (u.dni IS NULL OR u.dni = '')
              AND s.document_type = 'DNI'
              AND s.document_number IS NOT NULL
              AND s.document_number <> ''
        ");
    }

    public function down(): void
    {
        // No revertimos para no borrar DNIs ya usados
    }
};
