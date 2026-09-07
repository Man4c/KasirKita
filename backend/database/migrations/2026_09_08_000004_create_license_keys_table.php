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
        // 1. Create license_keys table
        if (! Schema::hasTable('license_keys')) {
            Schema::create('license_keys', function (Blueprint $table) {
                $table->id();
                $table->string('license_key', 64)->unique();
                $table->string('status', 20)->default('available')->index()->comment('available, redeemed, revoked');
                $table->string('duration_type', 20)->default('lifetime')->comment('lifetime, 1_year, 1_month, custom');
                $table->unsignedInteger('duration_days')->nullable()->comment('Valid days if duration_type is not lifetime');

                if (DB::getDriverName() === 'sqlite') {
                    $table->uuid('redeemed_by_store_id')->nullable()->index();
                    $table->uuid('redeemed_by_user_id')->nullable()->index();
                } else {
                    $table->foreignUuid('redeemed_by_store_id')->nullable()->constrained('stores')->nullOnDelete();
                    $table->foreignUuid('redeemed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                }

                $table->timestamp('redeemed_at')->nullable();
                $table->text('notes')->nullable()->comment('Sales batch, partner note, or direct customer note');
                $table->timestamps();
            });
        }

        // 2. Add subscription_expires_at to stores table if not present
        if (Schema::hasTable('stores') && ! Schema::hasColumn('stores', 'subscription_expires_at')) {
            Schema::table('stores', function (Blueprint $table) {
                $table->timestamp('subscription_expires_at')->nullable()->after('activated_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('license_keys');

        if (Schema::hasTable('stores') && Schema::hasColumn('stores', 'subscription_expires_at')) {
            Schema::table('stores', function (Blueprint $table) {
                $table->dropColumn('subscription_expires_at');
            });
        }
    }
};
