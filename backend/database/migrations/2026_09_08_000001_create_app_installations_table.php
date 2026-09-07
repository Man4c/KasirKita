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
        Schema::create('app_installations', function (Blueprint $table) {
            $table->id();
            $table->string('installation_id', 64)->unique()->comment('Persistent anonymous UUID generated on device');
            $table->string('device_model', 100)->nullable()->comment('Hardware model e.g. Samsung SM-A546E');
            $table->string('brand', 50)->nullable()->comment('Device brand e.g. Samsung, Xiaomi, Oppo');
            $table->string('os_name', 30)->default('Android')->comment('OS Platform name: Android, iOS, Web');
            $table->string('os_version', 50)->nullable()->comment('OS Version string e.g. Android 14');
            $table->string('app_version', 20)->default('1.3.1')->comment('Installed KasirKita SemVer e.g. 1.3.1');
            $table->unsignedInteger('app_version_code')->nullable()->comment('Numeric version code e.g. 5');
            $table->string('ip_address', 45)->nullable()->comment('Client IP address');
            $table->timestamp('first_installed_at')->nullable()->index()->comment('First time app was launched on device');
            $table->timestamp('last_active_at')->nullable()->index()->comment('Most recent heartbeat ping from device');
            $table->unsignedInteger('total_pings')->default(1)->comment('Cumulative app opens / heartbeat count');
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete()->comment('Associated logged-in user if available');
            $table->json('metadata')->nullable()->comment('Extra telemetry parameters (locale, orientation, etc.)');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('app_installations');
    }
};
