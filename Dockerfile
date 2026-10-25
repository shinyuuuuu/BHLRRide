FROM node:20 AS frontend
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ENV VITE_DEMO=true
RUN npm run build

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
COPY --chown=www-data:www-data --from=frontend /frontend/dist /var/www/html/public/app
COPY --chown=www-data:www-data --from=frontend /frontend/dist/images /var/www/html/public/images
COPY --chown=www-data:www-data --from=frontend ["/frontend/dist/BHLRRideLogo - Edited.png", "/var/www/html/public/"]
RUN composer install --no-dev --optimize-autoloader --no-interaction