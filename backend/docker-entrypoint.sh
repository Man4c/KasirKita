#!/bin/sh
set -e

# Bind Apache to dynamic PORT provided by Render (default 80 if not set)
PORT="${PORT:-80}"
echo "Starting Apache on port $PORT..."
sed -i "s/Listen 80/Listen $PORT/g" /etc/apache2/ports.conf
sed -i "s/:80/:$PORT/g" /etc/apache2/sites-available/000-default.conf

# Ensure APP_KEY exists
if [ -z "$APP_KEY" ]; then
    echo "APP_KEY is not set, generating..."
    php artisan key:generate --force || true
fi

# Optimize Laravel caches
echo "Optimizing Laravel configuration & routes..."
php artisan config:clear || true
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# Run database migrations on Supabase PostgreSQL
echo "Running database migrations..."
php artisan migrate --force || true

# Start Apache in foreground
echo "KasirKita API is live and serving requests."
exec apache2-foreground
