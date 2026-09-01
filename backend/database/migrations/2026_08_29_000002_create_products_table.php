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
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('name');
            $table->string('sku_barcode')->nullable()->unique()->index();
            $table->text('description')->nullable();
            $table->decimal('price', 15, 2)->default(0); // Selling price
            $table->decimal('avg_cost', 15, 2)->default(0); // Average Cost / HPP
            $table->integer('stock')->default(0); // Real-time perpetual stock
            $table->integer('min_stock')->default(5); // Minimum stock threshold alert
            $table->string('image_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
