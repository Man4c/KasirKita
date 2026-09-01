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
        Schema::create('stock_opnames', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('opname_number')->unique()->index();
            $table->foreignUuid('user_id')->constrained('users'); // Penanggung Jawab
            $table->string('status')->default('DRAFT'); // DRAFT, COMPLETED, CANCELLED
            $table->text('notes')->nullable();
            $table->timestamp('conducted_at')->nullable();
            $table->timestamps();
        });

        Schema::create('stock_opname_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('stock_opname_id')->constrained('stock_opnames')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products');
            $table->integer('system_stock'); // Stok sistem saat opname
            $table->integer('physical_stock'); // Stok fisik riil
            $table->integer('difference'); // Selisih (+ atau -)
            $table->decimal('unit_cost', 15, 2)->default(0); // HPP unit saat opname
            $table->decimal('total_difference_cost', 15, 2)->default(0); // Nominal kerugian/kelebihan
            $table->text('reason')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_opname_items');
        Schema::dropIfExists('stock_opnames');
    }
};
