<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Users (Owner & Cashier)
        $owner = User::create([
            'name' => 'Owner KasirKita',
            'email' => 'owner@kasirkita.com',
            'phone' => '081234567890',
            'password' => Hash::make('password123'),
            'role' => 'owner',
            'is_active' => true,
        ]);

        $cashier = User::create([
            'name' => 'Kasir Toko 1',
            'email' => 'kasir@kasirkita.com',
            'phone' => '081234567891',
            'password' => Hash::make('password123'),
            'role' => 'cashier',
            'is_active' => true,
        ]);

        // 2. Seed Categories
        $categoriesData = [
            ['name' => 'Makanan', 'slug' => 'makanan', 'description' => 'Produk makanan dan makanan instan'],
            ['name' => 'Minuman', 'slug' => 'minuman', 'description' => 'Aneka minuman dingin dan hangat'],
            ['name' => 'Snack & Camilan', 'slug' => 'snack-camilan', 'description' => 'Camilan, keripik, dan biskuit'],
            ['name' => 'Sembako', 'slug' => 'sembako', 'description' => 'Kebutuhan pokok rumah tangga'],
        ];

        $categories = [];
        foreach ($categoriesData as $cat) {
            $categories[$cat['slug']] = Category::create($cat);
        }

        // 3. Seed Sample Products with Initial Stock & Average Cost
        $sampleProducts = [
            [
                'category_id' => $categories['minuman']->id,
                'name' => 'Kopi Susu Gula Aren 250ml',
                'sku_barcode' => '8991001001',
                'description' => 'Kopi susu kemasan botol siap minum',
                'price' => 15000,
                'avg_cost' => 9000,
                'stock' => 50,
                'min_stock' => 10,
            ],
            [
                'category_id' => $categories['minuman']->id,
                'name' => 'Teh Botol Melati 350ml',
                'sku_barcode' => '8991001002',
                'description' => 'Teh melati manis segar',
                'price' => 5000,
                'avg_cost' => 3200,
                'stock' => 80,
                'min_stock' => 15,
            ],
            [
                'category_id' => $categories['snack-camilan']->id,
                'name' => 'Keripik Kentang Balado 68g',
                'sku_barcode' => '8991002001',
                'description' => 'Keripik kentang renyah rasa balado',
                'price' => 12000,
                'avg_cost' => 8500,
                'stock' => 40,
                'min_stock' => 8,
            ],
            [
                'category_id' => $categories['sembako']->id,
                'name' => 'Beras Premium 5kg',
                'sku_barcode' => '8991003001',
                'description' => 'Beras putih pulen kualitas premium',
                'price' => 75000,
                'avg_cost' => 64000,
                'stock' => 25,
                'min_stock' => 5,
            ],
            [
                'category_id' => $categories['makanan']->id,
                'name' => 'Mie Instan Goreng Spesial',
                'sku_barcode' => '8991004001',
                'description' => 'Mie instan goreng rasa bawang',
                'price' => 3500,
                'avg_cost' => 2700,
                'stock' => 120,
                'min_stock' => 20,
            ],
        ];

        foreach ($sampleProducts as $p) {
            $product = Product::create($p);

            // Record initial stock movement (IN)
            StockMovement::create([
                'product_id' => $product->id,
                'user_id' => $owner->id,
                'type' => 'IN',
                'quantity' => $product->stock,
                'unit_cost' => $product->avg_cost,
                'total_cost' => $product->stock * $product->avg_cost,
                'balance_after' => $product->stock,
                'reference_type' => 'InitialStock',
                'notes' => 'Saldo awal inisialisasi sistem',
            ]);
        }
    }
}
