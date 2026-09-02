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
        Schema::create('store_settings', function (Blueprint $table) {
            $table->id();
            $table->string('name')->default('KasirKita Mart');
            $table->text('address')->nullable();
            $table->string('phone')->nullable();
            $table->longText('logo')->nullable();
            $table->text('receipt_footer')->nullable();
            $table->boolean('show_logo_on_receipt')->default(true);
            $table->boolean('show_phone_on_receipt')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_settings');
    }
};
