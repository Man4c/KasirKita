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
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_for_sale')->default(true)->after('is_active');
            $table->foreignUuid('default_pos_unit_id')->nullable()->after('base_unit_id')->constrained('units')->nullOnDelete();
        });

        Schema::table('product_unit_conversions', function (Blueprint $table) {
            $table->boolean('is_default_pos')->default(false)->after('is_base');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_unit_conversions', function (Blueprint $table) {
            $table->dropColumn('is_default_pos');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['default_pos_unit_id']);
            $table->dropColumn(['is_for_sale', 'default_pos_unit_id']);
        });
    }
};
