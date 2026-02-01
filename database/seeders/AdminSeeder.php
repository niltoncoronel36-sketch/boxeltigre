<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
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

        $admin = User::updateOrCreate(
            ['email' => 'admin@example.com'],
            ['name' => 'Admin', 'password' => Hash::make('password')]
        );

        $adminRoleId = Role::where('key', 'admin')->value('id');
        if ($adminRoleId) {
            $admin->roles()->syncWithoutDetaching([$adminRoleId]);
        }
    }
}
