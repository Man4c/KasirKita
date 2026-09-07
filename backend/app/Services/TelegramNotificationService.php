<?php

namespace App\Services;

use App\Models\Store;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class TelegramNotificationService
{
    /**
     * Send a notification when a new store registers.
     */
    public function notifyNewStoreRegistered(Store $store, User $owner): bool
    {
        $botToken = config('services.telegram.bot_token');
        $chatId = config('services.telegram.admin_chat_id');

        if (empty($botToken) || empty($chatId)) {
            Log::info('TelegramNotificationService: Notifikasi dilewati karena TELEGRAM_BOT_TOKEN atau TELEGRAM_ADMIN_CHAT_ID belum dikonfigurasi.');
            return false;
        }

        $trialEnd = $store->trial_ends_at
            ? $store->trial_ends_at->timezone('Asia/Jakarta')->translatedFormat('d F Y, H:i')
            : '14 Hari ke Depan';

        $registeredAt = now()->timezone('Asia/Jakarta')->translatedFormat('d F Y, H:i');

        $businessTypeLabels = [
            'retail' => 'Ritel / Toko Kelontong',
            'fnb' => 'F&B / Kuliner / Cafe / Resto',
            'service' => 'Jasa / Layanan',
            'other' => 'Usaha Lainnya',
        ];

        $typeLabel = $businessTypeLabels[$store->business_type] ?? strtoupper($store->business_type);

        $text = "🏪 *TOKO BARU TERDAFTAR DI KASIRKITA!*\n"
            . "━━━━━━━━━━━━━━━━━━━━\n"
            . "🏬 *Nama Toko:* " . $this->escapeMarkdown($store->name) . "\n"
            . "🏷 *Tipe Usaha:* " . $this->escapeMarkdown($typeLabel) . "\n"
            . "👤 *Pemilik:* " . $this->escapeMarkdown($owner->name) . "\n"
            . "📱 *No. HP / WA:* " . $this->escapeMarkdown($owner->phone ?? '-') . "\n"
            . "✉️ *Email:* " . $this->escapeMarkdown($owner->email) . "\n"
            . "⏳ *Status:* Trial 14 Hari (s/d {$trialEnd})\n"
            . "━━━━━━━━━━━━━━━━━━━━\n"
            . "⏰ *Waktu:* {$registeredAt} WIB";

        return $this->sendMessage($text);
    }

    /**
     * Send raw markdown text message to the configured admin chat ID.
     */
    public function sendMessage(string $text): bool
    {
        $botToken = config('services.telegram.bot_token');
        $chatId = config('services.telegram.admin_chat_id');

        if (empty($botToken) || empty($chatId)) {
            return false;
        }

        try {
            $response = Http::timeout(5)->post("https://api.telegram.org/bot{$botToken}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $text,
                'parse_mode' => 'Markdown',
            ]);

            if (! $response->successful()) {
                Log::warning('TelegramNotificationService: Gagal mengirim pesan ke Telegram', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return false;
            }

            return true;
        } catch (Throwable $e) {
            Log::warning('TelegramNotificationService: Terjadi kesalahan koneksi Telegram: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Escape basic Markdown special characters.
     */
    private function escapeMarkdown(string $text): string
    {
        return str_replace(['_', '*', '`', '['], ['\\_', '\\*', '\\`', '\\['], $text);
    }
}
