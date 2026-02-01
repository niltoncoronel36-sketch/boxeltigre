<?php
// database/seeders/RoleSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['key' => 'admin', 'name' => 'Administrador'],
            ['key' => 'cashier', 'name' => 'Caja/Recepción'],
            ['key' => 'trainer', 'name' => 'Entrenador'],
            ['key' => 'student', 'name' => 'Alumno'],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['key' => $role['key']], $role);
        }
    }
}
