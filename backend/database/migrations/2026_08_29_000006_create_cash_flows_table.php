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
        Schema::create('cash_flows', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users');
            $table->foreignUuid('transaction_id')->nullable()->constrained('transactions')->nullOnDelete();
            $table->string('type'); // IN (Pemasukan) or OUT (Pengeluaran)
            $table->string('category'); // SALES, OPERATIONAL, PURCHASE, OTHER
            $table->decimal('amount', 15, 2)->default(0);
            $table->date('flow_date')->index();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['flow_date', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cash_flows');
    }
};
