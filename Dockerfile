FROM php:8.4-cli-alpine

# Instalar dependencias del sistema y extensiones de PHP (PostgreSQL, GD, ZIP)
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    libxml2-dev \
    zip \
    unzip \
    nodejs \
    npm \
    postgresql-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_pgsql gd zip

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

# Copiar archivos del proyecto
COPY . .

# Instalar dependencias PHP y compilar assets frontend
RUN composer install --no-dev --optimize-autoloader --no-interaction --ignore-platform-reqs
RUN npm install && npm run build

# Permisos de almacenamiento
RUN chmod -R 777 storage bootstrap/cache

EXPOSE 8080

CMD php artisan config:clear && php artisan route:cache && php artisan view:cache && php artisan serve --host=0.0.0.0 --port=${PORT:-8080}