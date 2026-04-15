<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'Beverages', 'slug' => 'beverages'],
            ['name' => 'Appetizers', 'slug' => 'appetizers'],
            ['name' => 'Main Course', 'slug' => 'main-course'],
            ['name' => 'Desserts', 'slug' => 'desserts'],
            ['name' => 'Sides', 'slug' => 'sides'],
            ['name' => 'Combos', 'slug' => 'combos'],
        ];

        foreach ($categories as $category) {
            Category::query()->updateOrCreate(
                ['slug' => $category['slug']],
                ['name' => $category['name'], 'is_active' => true]
            );
        }
    }
}
