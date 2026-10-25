FROM node:20 AS assets
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM serversideup/php:8.3-fpm-nginx
USER root
RUN install-php-extensions pdo_pgsql
USER www-data
COPY --chown=www-data:www-data . /var/www/html
COPY --chown=www-data:www-data --from=assets /app/public/build /var/www/html/public/build
RUN composer install --no-dev --optimize-autoloader --no-interaction