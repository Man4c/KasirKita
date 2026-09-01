<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create Units Table
        Schema::create('units', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name'); // Pcs, Kilogram, Dus, Liter, Botol
            $table->string('symbol')->unique(); // pcs, kg, dus, l, btl
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Seed Default Standard Units
        $defaultUnits = [
            ['id' => (string) Str::uuid(), 'name' => 'Pieces / Buah', 'symbol' => 'pcs', 'description' => 'Satuan hitungan eceran standar', 'created_at' => now(), 'updated_at' => now()],
            ['id' => (string) Str::uuid(), 'name' => 'Kilogram', 'symbol' => 'kg', 'description' => 'Satuan berat / timbangan', 'created_at' => now(), 'updated_at' => now()],
            ['id' => (string) Str::uuid(), 'name' => 'Gram', 'symbol' => 'g', 'description' => 'Satuan berat kecil (1 kg = 1000 g)', 'created_at' => now(), 'updated_at' => now()],
            ['id' => (string) Str::uuid(), 'name' => 'Liter', 'symbol' => 'l', 'description' => 'Satuan volume / cairan', 'created_at' => now(), 'updated_at' => now()],
            ['id' => (string) Str::uuid(), 'name' => 'Dus / Karton', 'symbol' => 'dus', 'description' => 'Satuan kemasan kardus / grosir', 'created_at' => now(), 'updated_at' => now()],
            ['id' => (string) Str::uuid(), 'name' => 'Botol', 'symbol' => 'btl', 'description' => 'Satuan kemasan botol', 'created_at' => now(), 'updated_at' => now()],
            ['id' => (string) Str::uuid(), 'name' => 'Pack / Bungkus', 'symbol' => 'pack', 'description' => 'Satuan kemasan pack', 'created_at' => now(), 'updated_at' => now()],
            ['id' => (string) Str::uuid(), 'name' => 'Renceng', 'symbol' => 'rcg', 'description' => 'Satuan kemasan renceng', 'created_at' => now(), 'updated_at' => now()],
        ];
        DB::table('units')->insert($defaultUnits);

        $defaultBaseUnitId = DB::table('units')->where('symbol', 'pcs')->value('id');

        // 2. Alter Products Table (add base_unit_id, adjust precision, add soft deletes)
        Schema::table('products', function (Blueprint $table) use ($defaultBaseUnitId) {
            $table->foreignUuid('base_unit_id')->nullable()->after('category_id')->constrained('units')->restrictOnDelete();
            $table->decimal('stock', 12, 4)->default(0)->change();
            $table->decimal('min_stock', 12, 4)->default(5)->change();
            $table->decimal('avg_cost', 15, 4)->default(0)->change();
            $table->softDeletes()->after('is_active');
        });

        // Backfill existing products with default 'pcs' base_unit_id
        if ($defaultBaseUnitId) {
            DB::table('products')->whereNull('base_unit_id')->update(['base_unit_id' => $defaultBaseUnitId]);
        }

        // 3. Create Product Unit Conversions Table
        Schema::create('product_unit_conversions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('unit_id')->constrained('units')->restrictOnDelete();
            $table->decimal('conversion_factor', 12, 4)->default(1.0000);
            $table->string('sku_barcode')->nullable()->unique();
            $table->decimal('price', 15, 2)->default(0);
            $table->boolean('is_base')->default(false);
            $table->timestamps();

            $table->unique(['product_id', 'unit_id'], 'uniq_product_unit');
        });

        // Constraint factor must be positive for Postgres
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE product_unit_conversions ADD CONSTRAINT chk_conversion_factor_positive CHECK (conversion_factor > 0);');
        }

        // Partial Unique Index for is_base = true (Supported by SQLite 3.8+ & PostgreSQL)
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('CREATE UNIQUE INDEX uniq_base_unit_per_product ON product_unit_conversions (product_id) WHERE is_base = 1;');
        } else {
            DB::statement('CREATE UNIQUE INDEX uniq_base_unit_per_product ON product_unit_conversions (product_id) WHERE is_base = true;');
        }

        // 4. Backfill existing products into product_unit_conversions using chunkById
        DB::table('products')->orderBy('id')->chunkById(200, function ($products) {
            $records = [];
            foreach ($products as $p) {
                $records[] = [
                    'id' => (string) Str::uuid(),
                    'product_id' => $p->id,
                    'unit_id' => $p->base_unit_id,
                    'conversion_factor' => 1.0000,
                    'sku_barcode' => $p->sku_barcode,
                    'price' => $p->price,
                    'is_base' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
            if (!empty($records)) {
                DB::table('product_unit_conversions')->insert($records);
            }
        });

        // 5. Alter Transaction Items Table
        Schema::table('transaction_items', function (Blueprint $table) {
            $table->string('unit_name')->nullable()->after('product_name');
            $table->decimal('conversion_factor', 12, 4)->default(1.0000)->after('unit_name');
            $table->decimal('quantity', 12, 4)->default(1)->change();
            $table->decimal('base_quantity', 12, 4)->default(1)->after('quantity');
            $table->decimal('unit_cost', 15, 4)->default(0)->change();
            $table->decimal('total_cost', 15, 4)->default(0)->change();
        });

        // 6. Alter Stock Movements Table
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->string('unit_name')->nullable()->after('quantity');
            $table->decimal('conversion_factor', 12, 4)->default(1.0000)->after('unit_name');
            $table->decimal('quantity', 12, 4)->change();
            $table->decimal('base_quantity', 12, 4)->default(0)->after('conversion_factor');
            $table->decimal('unit_cost', 15, 4)->default(0)->change();
            $table->decimal('balance_after', 12, 4)->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropColumn(['unit_name', 'conversion_factor', 'base_quantity']);
        });

        Schema::table('transaction_items', function (Blueprint $table) {
            $table->dropColumn(['unit_name', 'conversion_factor', 'base_quantity']);
        });

        DB::statement('DROP INDEX IF EXISTS uniq_base_unit_per_product;');
        Schema::dropIfExists('product_unit_conversions');

        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['base_unit_id']);
            $table->dropColumn(['base_unit_id', 'deleted_at']);
        });

        Schema::dropIfExists('units');
    }
};
