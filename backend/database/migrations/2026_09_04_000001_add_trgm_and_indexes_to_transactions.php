<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Enable pg_trgm extension and create GIN trigram indexes if running on PostgreSQL
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_transactions_invoice_number_trgm ON transactions USING gin (invoice_number gin_trgm_ops);');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_transactions_customer_name_trgm ON transactions USING gin (customer_name gin_trgm_ops);');
        }

        // 2. Add B-Tree indexes on payment_method and payment_status for fast filtering
        Schema::table('transactions', function (Blueprint $table) {
            $table->index('payment_method');
            $table->index('payment_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['payment_method']);
            $table->dropIndex(['payment_status']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS idx_transactions_customer_name_trgm;');
            DB::statement('DROP INDEX IF EXISTS idx_transactions_invoice_number_trgm;');
        }
    }
};
