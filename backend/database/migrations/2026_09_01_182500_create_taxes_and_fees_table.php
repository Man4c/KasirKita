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
        Schema::create('taxes_and_fees', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name'); // e.g. "PPN 11%", "PB1 Restoran 10%", "Biaya Kantong Plastik", "Admin QRIS 0.7%"
            $table->enum('type', ['PERCENTAGE', 'FIXED'])->default('PERCENTAGE');
            $table->decimal('value', 12, 4)->default(0); // 11.0000 (%) or 200.0000 (Rp)
            $table->enum('apply_to', ['ALL', 'SPECIFIC_PAYMENT', 'TAKEAWAY_ONLY', 'MANUAL'])->default('ALL');
            $table->string('payment_method')->nullable(); // QRIS, TRANSFER, CASH
            $table->boolean('is_tax')->default(false); // true = Pajak resmi (PPN/PB1), false = Biaya operasional/layanan
            $table->boolean('is_default')->default(false); // otomatis terpilih di POS
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('taxes_and_fees');
    }
};
