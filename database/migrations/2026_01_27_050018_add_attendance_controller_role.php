<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $exists = DB::table('roles')->where('key', 'attendance_controller')->exists();

        if (! $exists) {
            DB::table('roles')->insert([
                'key' => 'attendance_controller',
                'name' => 'Control de Asistencia',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('roles')->where('key', 'attendance_controller')->delete();
    }
};
