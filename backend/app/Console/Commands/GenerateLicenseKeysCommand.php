<?php

namespace App\Console\Commands;

use App\Services\LicenseService;
use Illuminate\Console\Command;

class GenerateLicenseKeysCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'license:generate 
                            {--count=1 : Jumlah kode lisensi yang ingin digenerate (maks 100)}
                            {--duration=lifetime : Tipe durasi (lifetime, 1_year, 1_month, custom)}
                            {--days= : Jumlah hari jika memilih durasi custom}
                            {--notes= : Catatan distribusi lisensi}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate serial key aktivasi toko baru berformat KK-PRO-XXXX-XXXX';

    /**
     * Execute the console command.
     */
    public function handle(LicenseService $licenseService): int
    {
        $count = (int) $this->option('count');
        $duration = (string) $this->option('duration');
        $days = $this->option('days') ? (int) $this->option('days') : null;
        $notes = $this->option('notes') ? (string) $this->option('notes') : null;

        $this->info("🔑 Membuat {$count} kode lisensi KasirKita PRO (Tipe: {$duration})...");

        $keys = $licenseService->createBatch($count, $duration, $days, $notes);

        $tableData = [];
        foreach ($keys as $k) {
            $tableData[] = [
                'ID' => $k->id,
                'Serial Key' => $k->license_key,
                'Durasi' => strtoupper($k->duration_type),
                'Hari' => $k->duration_days ?? 'Permanen',
                'Status' => strtoupper($k->status),
                'Catatan' => $k->notes ?? '-',
            ];
        }

        $this->table(['ID', 'Serial Key', 'Durasi', 'Hari', 'Status', 'Catatan'], $tableData);
        $this->info("✅ Sukses! Sebanyak {$count} kode lisensi siap didistribusikan ke calon pelanggan.");

        return self::SUCCESS;
    }
}
