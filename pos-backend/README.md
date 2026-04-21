# POS Backend (Laravel API)

Production-style backend for a UAE Retail POS and Inventory Management System.

## Stack

- Laravel 13
- MySQL
- Laravel Passport (API token auth)
- REST APIs
- Queue-ready architecture

## Implemented Modules

- Authentication (`/api/auth/login`, `/api/auth/me`, `/api/auth/logout`)
- Role-based access control (`admin`, `manager`, `cashier`)
- Product management (`/api/products`)
- POS checkout flow (`/api/orders`) with:
  - stock validation and deduction
  - discount support (fixed/percentage)
  - VAT (5%) calculation
  - multi-payment support (cash/card/split)
- Dashboard analytics (`/api/dashboard`)
- Sales reports (`/api/reports/sales`)
- Sales export (CSV fallback) (`/api/reports/sales/export-csv`)

## Database Entities

- `users`
- `roles`
- `categories`
- `products`
- `orders`
- `order_items`
- `payments`
- Passport OAuth tables

## Local Setup

1. Install dependencies:

```bash
composer install
```

2. Configure environment:

```bash
add .env
php artisan key:generate
```

3. Set DB credentials in `.env`:

- `DB_CONNECTION=mysql`
- `DB_HOST=127.0.0.1`
- `DB_PORT=3306`
- `DB_DATABASE=pos_backend`
- `DB_USERNAME=root`
- `DB_PASSWORD=`

4. Run migrations and seeders:

```bash
php artisan migrate
php artisan db:seed
```

5. Start API server:

```bash
php artisan serve
```

## Seeded Login Users

- `admin@pos.com` / `Password`
- `manager@pos.com` / `Password`
- `cashier@pos.com` / `Password`


## Notes
- CSV export is implemented.
