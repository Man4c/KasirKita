<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('stock_opname_items', function (Blueprint $table) {
            $table->decimal('system_stock', 12, 4)->default(0)->change();
            $table->decimal('physical_stock', 12, 4)->default(0)->change();
            $table->decimal('difference', 12, 4)->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_opname_items', function (Blueprint $table) {
            $table->integer('system_stock')->default(0)->change();
            $table->integer('physical_stock')->default(0)->change();
            $table->integer('difference')->default(0)->change();
        });
    }
};
