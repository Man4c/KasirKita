<?php

namespace App\Console\Commands;

use App\Services\TelegramNotificationService;
use Illuminate\Console\Command;

class TestTelegramNotificationCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'telegram:test {--message= : Custom test message to send}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Kirim pesan uji coba ke bot Telegram admin untuk memverifikasi konfigurasi';

    /**
     * Execute the command.
     */
    public function handle(TelegramNotificationService $telegramService): int
    {
        $botToken = config('services.telegram.bot_token');
        $chatId = config('services.telegram.admin_chat_id');

        $this->info('Memeriksa konfigurasi Telegram KasirKita...');
        $this->line('• TELEGRAM_BOT_TOKEN: ' . ($botToken ? substr($botToken, 0, 8) . '...' : '<kosong / belum diisi>'));
        $this->line('• TELEGRAM_ADMIN_CHAT_ID: ' . ($chatId ?: '<kosong / belum diisi>'));

        if (empty($botToken) || empty($chatId)) {
            $this->error("\nKonfigurasi Telegram belum lengkap!");
            $this->warn("Silakan tambahkan variabel berikut pada file .env atau dashboard Render:");
            $this->line("TELEGRAM_BOT_TOKEN=your_bot_token_here");
            $this->line("TELEGRAM_ADMIN_CHAT_ID=your_chat_id_here\n");
            return Command::FAILURE;
        }

        $this->info("\nMengirim pesan uji coba ke Telegram...");

        $now = now()->timezone('Asia/Jakarta')->translatedFormat('d F Y, H:i:s');
        $customText = $this->option('message');

        $text = "🔔 *UJI COBA NOTIFIKASI KASIRKITA POS*\n"
            . "━━━━━━━━━━━━━━━━━━━━\n"
            . "✅ *Status:* Bot Telegram Terhubung Sukses!\n"
            . "🚀 *Sistem:* Backend Laravel KasirKita Multi-Tenant\n"
            . ($customText ? "💬 *Pesan:* {$customText}\n" : '')
            . "━━━━━━━━━━━━━━━━━━━━\n"
            . "⏰ *Waktu:* {$now} WIB";

        $success = $telegramService->sendMessage($text);

        if ($success) {
            $this->info('✅ Pesan berhasil terkirim ke Telegram admin!');
            return Command::SUCCESS;
        }

        $this->error('❌ Gagal mengirim pesan ke Telegram. Periksa log storage/logs/laravel.log atau pastikan Bot Token & Chat ID valid dan Anda telah menekan /start pada bot.');
        return Command::FAILURE;
    }
}
