<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            // 1. Categories: Change global unique slug to composite (store_id, slug)
            DB::statement('ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_unique;');
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS uniq_category_store_slug ON categories (store_id, slug);');

            // 2. Units: Change global unique symbol to composite (store_id, symbol)
            DB::statement('ALTER TABLE units DROP CONSTRAINT IF EXISTS units_symbol_unique;');
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS uniq_shared_unit_symbol ON units (symbol) WHERE store_id IS NULL;');
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS uniq_store_unit_symbol ON units (store_id, symbol) WHERE store_id IS NOT NULL;');
        } else {
            // SQLite (Testing environment)
            try {
                DB::statement('DROP INDEX IF EXISTS categories_slug_unique;');
                DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS uniq_category_store_slug ON categories (store_id, slug);');
            } catch (\Throwable $e) {}

            try {
                DB::statement('DROP INDEX IF EXISTS units_symbol_unique;');
                DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS uniq_shared_unit_symbol ON units (symbol) WHERE store_id IS NULL;');
                DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS uniq_store_unit_symbol ON units (store_id, symbol) WHERE store_id IS NOT NULL;');
            } catch (\Throwable $e) {}
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS uniq_category_store_slug;');
            DB::statement('ALTER TABLE categories ADD CONSTRAINT categories_slug_unique UNIQUE (slug);');

            DB::statement('DROP INDEX IF EXISTS uniq_shared_unit_symbol;');
            DB::statement('DROP INDEX IF EXISTS uniq_store_unit_symbol;');
            DB::statement('ALTER TABLE units ADD CONSTRAINT units_symbol_unique UNIQUE (symbol);');
        } else {
            try {
                DB::statement('DROP INDEX IF EXISTS uniq_category_store_slug;');
                DB::statement('CREATE UNIQUE INDEX categories_slug_unique ON categories (slug);');
            } catch (\Throwable $e) {}

            try {
                DB::statement('DROP INDEX IF EXISTS uniq_shared_unit_symbol;');
                DB::statement('DROP INDEX IF EXISTS uniq_store_unit_symbol;');
                DB::statement('CREATE UNIQUE INDEX units_symbol_unique ON units (symbol);');
            } catch (\Throwable $e) {}
        }
    }
};
