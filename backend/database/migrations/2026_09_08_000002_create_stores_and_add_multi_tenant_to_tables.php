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
        // 1. Create stores table
        if (! Schema::hasTable('stores')) {
            Schema::create('stores', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name');
                $table->string('business_type', 50)->default('retail')->comment('retail, fnb, service, etc.');
                $table->foreignUuid('owner_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('phone', 50)->nullable();
                $table->text('address')->nullable();
                $table->string('subscription_status', 20)->default('trial')->comment('trial, active, expired');
                $table->timestamp('trial_ends_at')->nullable();
                $table->timestamp('activated_at')->nullable();
                $table->string('license_key', 64)->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        // 2. Add store_id to all business and user tables
        $tables = [
            'users',
            'products',
            'product_unit_conversions',
            'categories',
            'units',
            'customers',
            'suppliers',
            'discounts',
            'taxes_and_fees',
            'transactions',
            'stock_movements',
            'stock_opnames',
            'cash_flows',
            'store_settings',
        ];

        foreach ($tables as $tbl) {
            if (Schema::hasTable($tbl) && ! Schema::hasColumn($tbl, 'store_id')) {
                Schema::table($tbl, function (Blueprint $table) use ($tbl) {
                    if (DB::getDriverName() === 'sqlite') {
                        $table->uuid('store_id')->nullable()->after('id');
                    } else {
                        $table->foreignUuid('store_id')->nullable()->after('id')->constrained('stores')->cascadeOnDelete();
                    }
                });
            }
        }

        // 3. Atomic Migration for Existing Data (Store #1: KasirKita Mart & Cafe)
        $hasExistingData = false;
        if (Schema::hasTable('users') && DB::table('users')->exists()) {
            $hasExistingData = true;
        }

        if ($hasExistingData && DB::table('stores')->count() === 0) {
            $defaultStoreId = (string) Str::uuid();
            $firstOwnerId = DB::table('users')->where('role', 'owner')->value('id')
                ?? DB::table('users')->value('id');

            DB::table('stores')->insert([
                'id' => $defaultStoreId,
                'name' => 'KasirKita Mart & Cafe',
                'business_type' => 'retail',
                'owner_id' => $firstOwnerId,
                'subscription_status' => 'active', // Default existing store is active lifetime
                'activated_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($tables as $tbl) {
                if (Schema::hasTable($tbl) && Schema::hasColumn($tbl, 'store_id')) {
                    DB::table($tbl)->whereNull('store_id')->update(['store_id' => $defaultStoreId]);
                }
            }
        }

        // 4. Barcode uniqueness revision: Scope barcode uniqueness per store_id
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sku_barcode_unique;');
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS products_store_sku_barcode_unique ON products (store_id, sku_barcode) WHERE sku_barcode IS NOT NULL;');

            if (Schema::hasTable('product_unit_conversions')) {
                DB::statement('ALTER TABLE product_unit_conversions DROP CONSTRAINT IF EXISTS product_unit_conversions_sku_barcode_unique;');
                DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS puc_store_sku_barcode_unique ON product_unit_conversions (store_id, sku_barcode) WHERE sku_barcode IS NOT NULL;');
            }
        } else {
            // SQLite (Testing environment) - Use direct DROP/CREATE INDEX to avoid table recreation
            try {
                DB::statement('DROP INDEX IF EXISTS products_sku_barcode_unique;');
                DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS products_store_sku_barcode_unique ON products (store_id, sku_barcode) WHERE sku_barcode IS NOT NULL;');
            } catch (\Throwable $e) {}

            if (Schema::hasTable('product_unit_conversions')) {
                try {
                    DB::statement('DROP INDEX IF EXISTS product_unit_conversions_sku_barcode_unique;');
                    DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS puc_store_sku_barcode_unique ON product_unit_conversions (store_id, sku_barcode) WHERE sku_barcode IS NOT NULL;');
                } catch (\Throwable $e) {}
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'store_settings',
            'cash_flows',
            'stock_opnames',
            'stock_movements',
            'transactions',
            'taxes_and_fees',
            'discounts',
            'suppliers',
            'customers',
            'units',
            'categories',
            'product_unit_conversions',
            'products',
            'users',
        ];

        foreach ($tables as $tbl) {
            if (Schema::hasTable($tbl) && Schema::hasColumn($tbl, 'store_id')) {
                Schema::table($tbl, function (Blueprint $table) {
                    if (DB::getDriverName() !== 'sqlite') {
                        $table->dropForeign(['store_id']);
                    }
                    $table->dropColumn('store_id');
                });
            }
        }

        Schema::dropIfExists('stores');
    }
};
