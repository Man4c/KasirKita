<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Discount;
use App\Models\Product;
use App\Models\ProductUnitConversion;
use App\Models\StockMovement;
use App\Models\StoreSetting;
use App\Models\Supplier;
use App\Models\TaxAndFee;
use App\Models\Unit;
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
        // 1. Seed Store Settings
        StoreSetting::updateOrCreate(
            ['id' => 1],
            [
                'name' => 'KasirKita Mart & Cafe',
                'address' => 'Jl. Jenderal Sudirman No. 123, Jakarta Pusat',
                'phone' => '081234567890',
                'receipt_footer' => 'Terima kasih atas kunjungan Anda! Layanan Konsumen: 0812-3456-7890',
                'show_logo_on_receipt' => true,
                'show_phone_on_receipt' => true,
                'preferences' => StoreSetting::DEFAULT_PREFERENCES,
            ]
        );

        // 2. Seed Users (Owner & Cashier)
        $owner = User::updateOrCreate(
            ['email' => 'owner@kasirkita.com'],
            [
                'name' => 'Owner KasirKita',
                'phone' => '081234567890',
                'password' => Hash::make('password123'),
                'role' => 'owner',
                'is_active' => true,
            ]
        );

        $cashier = User::updateOrCreate(
            ['email' => 'kasir@kasirkita.com'],
            [
                'name' => 'Kasir Toko 1',
                'phone' => '081234567891',
                'password' => Hash::make('password123'),
                'role' => 'cashier',
                'is_active' => true,
            ]
        );

        // 3. Seed Units of Measurement (UoM)
        $unitsData = [
            ['name' => 'Pieces / Buah', 'symbol' => 'pcs', 'description' => 'Satuan hitungan eceran standar barang satuan'],
            ['name' => 'Kilogram', 'symbol' => 'kg', 'description' => 'Satuan berat atau timbangan'],
            ['name' => 'Gram', 'symbol' => 'g', 'description' => 'Satuan berat gram (1 kg = 1000 g)'],
            ['name' => 'Liter', 'symbol' => 'l', 'description' => 'Satuan volume cairan'],
            ['name' => 'Botol', 'symbol' => 'btl', 'description' => 'Satuan kemasan botol minuman atau saus'],
            ['name' => 'Pack / Bungkus', 'symbol' => 'pack', 'description' => 'Satuan kemasan sachet, pack, atau bungkus'],
            ['name' => 'Dus / Karton', 'symbol' => 'dus', 'description' => 'Satuan kemasan kardus atau karton grosir'],
            ['name' => 'Cup / Gelas', 'symbol' => 'cup', 'description' => 'Satuan kemasan gelas / cup minuman'],
            ['name' => 'Porsi', 'symbol' => 'porsi', 'description' => 'Satuan porsi makanan siap saji'],
        ];

        $units = [];
        foreach ($unitsData as $u) {
            $units[$u['symbol']] = Unit::firstOrCreate(
                ['symbol' => $u['symbol']],
                [
                    'name' => $u['name'],
                    'description' => $u['description'],
                ]
            );
        }

        // 4. Seed Categories
        $categoriesData = [
            ['name' => 'Makanan', 'slug' => 'makanan', 'description' => 'Produk makanan siap saji, olahan, dan mie instan'],
            ['name' => 'Minuman', 'slug' => 'minuman', 'description' => 'Aneka minuman botol, kopi, teh, dan air mineral'],
            ['name' => 'Snack & Camilan', 'slug' => 'snack-camilan', 'description' => 'Camilan ringan, keripik balado, biskuit, dan kue'],
            ['name' => 'Sembako', 'slug' => 'sembako', 'description' => 'Kebutuhan pokok beras, minyak goreng, gula, dan telur'],
        ];

        $categories = [];
        foreach ($categoriesData as $cat) {
            $categories[$cat['slug']] = Category::firstOrCreate(
                ['slug' => $cat['slug']],
                [
                    'name' => $cat['name'],
                    'description' => $cat['description'],
                ]
            );
        }

        // 5. Seed Suppliers
        $suppliersData = [
            [
                'name' => 'Distributor Minuman Segar Nusantara',
                'contact_person' => 'Budi Santoso',
                'phone' => '081288991122',
                'email' => 'sales@minumansegar.com',
                'address' => 'Kawasan Industri Pulo Gadung Blok A2, Jakarta Timur',
                'bank_name' => 'BCA',
                'bank_account' => '8820192831',
                'bank_holder' => 'PT Minuman Segar Nusantara',
                'notes' => 'Supplier resmi distributor aneka kopi botol, teh kemasan, dan air mineral.',
                'is_active' => true,
            ],
            [
                'name' => 'Agen Sembako Makmur Bersama',
                'contact_person' => 'Hendra Wijaya',
                'phone' => '081399887766',
                'email' => 'hendra@sembakomakmur.co.id',
                'address' => 'Pasar Induk Kramat Jati No. 45, Jakarta Timur',
                'bank_name' => 'Mandiri',
                'bank_account' => '1400019283746',
                'bank_holder' => 'Hendra Wijaya',
                'notes' => 'Supplier grosir beras pandan wangi, minyak goreng, dan sembako berkualitas.',
                'is_active' => true,
            ],
            [
                'name' => 'Supplier Snack & Biskuit Jaya',
                'contact_person' => 'Siti Rahma',
                'phone' => '081577665544',
                'email' => 'order@snackjaya.com',
                'address' => 'Jl. Raya Daan Mogot Km 11, Jakarta Barat',
                'bank_name' => 'BRI',
                'bank_account' => '001201098765432',
                'bank_holder' => 'Siti Rahma',
                'notes' => 'Distributor camilan renyah, keripik balado, dan mie instan kartonan.',
                'is_active' => true,
            ],
        ];

        $suppliers = [];
        foreach ($suppliersData as $s) {
            $suppliers[] = Supplier::firstOrCreate(['name' => $s['name']], $s);
        }

        // 6. Seed Customers
        $customersData = [
            [
                'name' => 'Pelanggan Umum',
                'phone' => '080000000000',
                'email' => null,
                'address' => 'Walk-in Customer',
                'membership_type' => 'REGULAR',
                'notes' => 'Default customer untuk transaksi tunai tanpa member.',
                'is_active' => true,
            ],
            [
                'name' => 'Ahmad Fadhil',
                'phone' => '081298765432',
                'email' => 'ahmad.fadhil@gmail.com',
                'address' => 'Jl. Kemang Raya No. 15, Jakarta Selatan',
                'membership_type' => 'VIP',
                'notes' => 'Member VIP setia, langganan beli kopi susu harian.',
                'is_active' => true,
            ],
            [
                'name' => 'Warung Berkah Ibu Siti',
                'phone' => '081312345678',
                'email' => 'warungberkah@yahoo.com',
                'address' => 'Jl. Kebon Jeruk No. 88, Jakarta Barat',
                'membership_type' => 'WHOLESALE',
                'notes' => 'Pelanggan grosir rutin kulakan mie dan minyak goreng partai besar.',
                'is_active' => true,
            ],
        ];

        foreach ($customersData as $cust) {
            $existing = Customer::withTrashed()->where('name', $cust['name'])->orWhere('phone', $cust['phone'])->first();
            if (! $existing) {
                Customer::create($cust);
            }
        }

        // 7. Seed Taxes and Fees
        $taxesAndFeesData = [
            [
                'name' => 'PPN 11%',
                'type' => 'PERCENTAGE',
                'value' => 11,
                'apply_to' => 'ALL',
                'is_tax' => true,
                'is_default' => true,
                'is_active' => true,
                'description' => 'Pajak Pertambahan Nilai 11% regulasi standar DJP.',
            ],
            [
                'name' => 'Biaya Layanan & Kasir',
                'type' => 'PERCENTAGE',
                'value' => 2.5,
                'apply_to' => 'ALL',
                'is_tax' => false,
                'is_default' => false,
                'is_active' => true,
                'description' => 'Biaya layanan dan pemeliharaan sistem POS.',
            ],
            [
                'name' => 'Biaya Kantong Belanja',
                'type' => 'FIXED',
                'value' => 2000,
                'apply_to' => 'TAKEAWAY_ONLY',
                'is_tax' => false,
                'is_default' => false,
                'is_active' => true,
                'description' => 'Biaya tas spunbond ramah lingkungan untuk bawa pulang.',
            ],
        ];

        foreach ($taxesAndFeesData as $tf) {
            TaxAndFee::firstOrCreate(['name' => $tf['name']], $tf);
        }

        // 8. Seed Discounts & Promotions
        $discountsData = [
            [
                'code' => 'DISKON10',
                'name' => 'Promo Diskon 10%',
                'description' => 'Diskon 10% minimal belanja Rp50.000 (Maksimal potongan Rp25.000)',
                'type' => 'PERCENTAGE',
                'value' => 10,
                'min_purchase_amount' => 50000,
                'max_discount_amount' => 25000,
                'start_date' => now()->subDay(),
                'end_date' => now()->addMonths(6),
                'quota' => 500,
                'usage_count' => 0,
                'is_active' => true,
            ],
            [
                'code' => 'HEMAT5RB',
                'name' => 'Voucher Hemat Rp5.000',
                'description' => 'Potongan langsung Rp5.000 dengan minimal belanja Rp30.000',
                'type' => 'FIXED',
                'value' => 5000,
                'min_purchase_amount' => 30000,
                'max_discount_amount' => null,
                'start_date' => now()->subDay(),
                'end_date' => now()->addMonths(6),
                'quota' => 250,
                'usage_count' => 0,
                'is_active' => true,
            ],
            [
                'code' => 'JUMATBERKAH',
                'name' => 'Jumat Berkah 15%',
                'description' => 'Diskon 15% spesial akhir pekan minimal belanja Rp100.000',
                'type' => 'PERCENTAGE',
                'value' => 15,
                'min_purchase_amount' => 100000,
                'max_discount_amount' => 50000,
                'start_date' => now()->subDay(),
                'end_date' => now()->addMonths(3),
                'quota' => 100,
                'usage_count' => 0,
                'is_active' => true,
            ],
        ];

        foreach ($discountsData as $disc) {
            Discount::firstOrCreate(['code' => $disc['code']], $disc);
        }

        // 9. Seed Sample Products with Multi-UoM & Stock Movement
        $productsCatalog = [
            [
                'category_slug' => 'minuman',
                'base_unit' => 'btl',
                'name' => 'Kopi Susu Gula Aren 250ml',
                'sku_barcode' => '8991001001',
                'description' => 'Kopi susu gula aren segar kemasan botol siap minum',
                'price' => 15000,
                'avg_cost' => 9000,
                'stock' => 50,
                'min_stock' => 10,
                'supplier_index' => 0,
                'conversions' => [],
            ],
            [
                'category_slug' => 'minuman',
                'base_unit' => 'btl',
                'name' => 'Teh Botol Melati 350ml',
                'sku_barcode' => '8991001002',
                'description' => 'Teh melati wangi dan manis menyegarkan',
                'price' => 5000,
                'avg_cost' => 3200,
                'stock' => 120,
                'min_stock' => 24,
                'supplier_index' => 0,
                'conversions' => [
                    [
                        'unit' => 'dus',
                        'conversion_factor' => 24.0,
                        'price' => 105000,
                        'sku_barcode' => '8991001002-DUS',
                    ],
                ],
            ],
            [
                'category_slug' => 'makanan',
                'base_unit' => 'pack',
                'name' => 'Mie Instan Goreng Spesial',
                'sku_barcode' => '8991004001',
                'description' => 'Mie instan goreng favorit rasa bawang gurih komplit',
                'price' => 3500,
                'avg_cost' => 2700,
                'stock' => 160,
                'min_stock' => 40,
                'supplier_index' => 2,
                'conversions' => [
                    [
                        'unit' => 'dus',
                        'conversion_factor' => 40.0,
                        'price' => 132000,
                        'sku_barcode' => '8991004001-DUS',
                    ],
                ],
            ],
            [
                'category_slug' => 'snack-camilan',
                'base_unit' => 'pack',
                'name' => 'Keripik Kentang Balado 68g',
                'sku_barcode' => '8991002001',
                'description' => 'Keripik kentang renyah rasa balado pedas manis',
                'price' => 12000,
                'avg_cost' => 8500,
                'stock' => 45,
                'min_stock' => 10,
                'supplier_index' => 2,
                'conversions' => [],
            ],
            [
                'category_slug' => 'sembako',
                'base_unit' => 'pack',
                'name' => 'Beras Pandan Wangi 5kg',
                'sku_barcode' => '8991003001',
                'description' => 'Beras putih pulen wangi kualitas super kemasan 5kg',
                'price' => 78000,
                'avg_cost' => 65000,
                'stock' => 30,
                'min_stock' => 5,
                'supplier_index' => 1,
                'conversions' => [],
            ],
            [
                'category_slug' => 'sembako',
                'base_unit' => 'pack',
                'name' => 'Minyak Goreng Pouch 2L',
                'sku_barcode' => '8991003002',
                'description' => 'Minyak goreng kelapa sawit higienis kemasan pouch 2 Liter',
                'price' => 34000,
                'avg_cost' => 29000,
                'stock' => 60,
                'min_stock' => 12,
                'supplier_index' => 1,
                'conversions' => [
                    [
                        'unit' => 'dus',
                        'conversion_factor' => 6.0,
                        'price' => 198000,
                        'sku_barcode' => '8991003002-DUS',
                    ],
                ],
            ],
            [
                'category_slug' => 'minuman',
                'base_unit' => 'btl',
                'name' => 'Air Mineral Pegunungan 600ml',
                'sku_barcode' => '8991001003',
                'description' => 'Air mineral alami pegunungan segar dan menyehatkan',
                'price' => 3500,
                'avg_cost' => 2000,
                'stock' => 144,
                'min_stock' => 24,
                'supplier_index' => 0,
                'conversions' => [
                    [
                        'unit' => 'dus',
                        'conversion_factor' => 24.0,
                        'price' => 45000,
                        'sku_barcode' => '8991001003-DUS',
                    ],
                ],
            ],
            [
                'category_slug' => 'makanan',
                'base_unit' => 'pack',
                'name' => 'Roti Tawar Gandum Kupas',
                'sku_barcode' => '8991004002',
                'description' => 'Roti tawar gandum lembut kaya serat tanpa kulit pinggiran',
                'price' => 16500,
                'avg_cost' => 12500,
                'stock' => 25,
                'min_stock' => 5,
                'supplier_index' => 2,
                'conversions' => [],
            ],
        ];

        foreach ($productsCatalog as $item) {
            $catId = $categories[$item['category_slug']]->id;
            $unitModel = $units[$item['base_unit']] ?? $units['pcs'];
            $supplier = $suppliers[$item['supplier_index']] ?? null;

            $product = Product::withTrashed()->where('sku_barcode', $item['sku_barcode'])->first();
            if ($product) {
                if ($product->trashed()) {
                    $product->restore();
                }
                $product->update([
                    'category_id' => $catId,
                    'base_unit_id' => $unitModel->id,
                    'default_pos_unit_id' => $unitModel->id,
                    'name' => $item['name'],
                    'description' => $item['description'],
                    'price' => $item['price'],
                    'avg_cost' => $item['avg_cost'],
                    'stock' => $item['stock'],
                    'min_stock' => $item['min_stock'],
                    'is_active' => true,
                    'is_for_sale' => true,
                ]);
            } else {
                $product = Product::create([
                    'category_id' => $catId,
                    'base_unit_id' => $unitModel->id,
                    'default_pos_unit_id' => $unitModel->id,
                    'name' => $item['name'],
                    'sku_barcode' => $item['sku_barcode'],
                    'description' => $item['description'],
                    'price' => $item['price'],
                    'avg_cost' => $item['avg_cost'],
                    'stock' => $item['stock'],
                    'min_stock' => $item['min_stock'],
                    'is_active' => true,
                    'is_for_sale' => true,
                ]);
            }

            // Ensure base unit conversion exists with is_default_pos = true
            ProductUnitConversion::updateOrCreate(
                ['product_id' => $product->id, 'is_base' => true],
                [
                    'unit_id' => $unitModel->id,
                    'conversion_factor' => 1.0000,
                    'sku_barcode' => $product->sku_barcode,
                    'price' => $product->price,
                    'is_default_pos' => true,
                ]
            );

            // Record non-base unit conversions (e.g. Dus)
            if (! empty($item['conversions'])) {
                foreach ($item['conversions'] as $conv) {
                    $convUnit = $units[$conv['unit']] ?? null;
                    if ($convUnit) {
                        ProductUnitConversion::updateOrCreate(
                            ['product_id' => $product->id, 'unit_id' => $convUnit->id],
                            [
                                'conversion_factor' => $conv['conversion_factor'],
                                'sku_barcode' => $conv['sku_barcode'],
                                'price' => $conv['price'],
                                'is_base' => false,
                                'is_default_pos' => false,
                            ]
                        );
                    }
                }
            }

            // Record initial stock movement (IN) if not already recorded
            StockMovement::firstOrCreate(
                [
                    'product_id' => $product->id,
                    'reference_type' => 'InitialStock',
                ],
                [
                    'user_id' => $owner->id,
                    'supplier_id' => $supplier?->id,
                    'type' => 'IN',
                    'quantity' => $product->stock,
                    'unit_name' => $unitModel->name,
                    'conversion_factor' => 1.0000,
                    'base_quantity' => $product->stock,
                    'unit_cost' => $product->avg_cost,
                    'total_cost' => $product->stock * $product->avg_cost,
                    'balance_after' => $product->stock,
                    'notes' => 'Stok awal inisialisasi sistem KasirKita POS',
                    'created_at' => now(),
                ]
            );
        }
    }
}
