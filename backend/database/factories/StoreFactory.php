<?php

namespace Database\Factories;

use App\Models\Store;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Store>
 */
class StoreFactory extends Factory
{
    protected $model = Store::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'name' => fake()->company() . ' Mart',
            'business_type' => 'retail',
            'phone' => fake()->phoneNumber(),
            'address' => fake()->address(),
            'subscription_status' => 'trial',
            'trial_ends_at' => now()->addDays(14),
        ];
    }

    /**
     * Store with active subscription.
     */
    public function active(): static
    {
        return $this->state(fn () => [
            'subscription_status' => 'active',
            'activated_at' => now(),
            'license_key' => 'KK-PRO-' . strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4)),
        ]);
    }

    /**
     * Store with expired subscription.
     */
    public function expired(): static
    {
        return $this->state(fn () => [
            'subscription_status' => 'expired',
            'trial_ends_at' => now()->subDay(),
        ]);
    }
}
