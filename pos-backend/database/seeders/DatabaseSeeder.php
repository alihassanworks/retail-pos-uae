<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RoleSeeder::class);
        $this->call(CategorySeeder::class);

        $adminRole = Role::query()->where('slug', 'admin')->firstOrFail();
        $managerRole = Role::query()->where('slug', 'manager')->firstOrFail();
        $cashierRole = Role::query()->where('slug', 'cashier')->firstOrFail();

        User::query()->updateOrCreate(
            ['email' => 'admin@pos.com'],
            [
                'name' => 'POS Admin',
                'password' => Hash::make('Password'),
                'role_id' => $adminRole->id,
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'manager@pos.com'],
            [
                'name' => 'POS Manager',
                'password' => Hash::make('Password'),
                'role_id' => $managerRole->id,
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'cashier@pos.com'],
            [
                'name' => 'POS Cashier',
                'password' => Hash::make('Password'),
                'role_id' => $cashierRole->id,
            ]
        );
    }
}
