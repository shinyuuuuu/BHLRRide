# BHLRRide – Car and Motorcycle Rental Management System

BHLRRide is a web-based car and motorcycle rental management system developed using Laravel and PostgreSQL. It aims to help rental businesses in Bohol manage vehicle listings, customer bookings, payments, and rental transactions through a centralized platform.

## Project Overview

Many car and motorcycle rental businesses in Bohol still rely on manual logbooks, walk-in transactions, and Facebook or Messenger inquiries. BHLRRide aims to provide a more organized and convenient way for customers and rental businesses to manage the rental process.

## Technologies Used

- **Backend:** PHP 8.2 and Laravel 12
- **Frontend:** Blade Templates, HTML, CSS, JavaScript, Tailwind CSS, and Vite
- **Database:** PostgreSQL (Neon)
- **Authentication:** Laravel Breeze
- **Version Control:** Git and GitHub
- **Development Tools:** Visual Studio Code, Composer, Node.js, and npm

## System Users

### Customer / Renter
- Register and log in to an account
- Browse available cars and motorcycles
- View rental rates and vehicle details
- Book vehicles based on available dates
- Upload a driver's license and valid ID
- View booking and rental history
- Request booking extensions or cancellations
- Rate vehicles and rental services

### Rental Staff / Owner
- Manage vehicle listings and information
- Upload vehicle photos
- Approve or reject booking requests
- Update vehicle availability and maintenance status
- Record vehicle conditions before and after rentals
- Manage deposits and damage charges

### Administrator
- Manage rental vendors, branches, and staff accounts
- Monitor rental transactions
- Generate rental and revenue reports
- Manage disputes and penalties
- Oversee system operations

## Development Progress

### Completed
- [x] Laravel 12 project initialization
- [x] Git and GitHub repository setup
- [x] PostgreSQL database connection using Neon
- [x] Database migrations and Eloquent models
- [x] Laravel Breeze authentication installation
- [x] Customer registration
- [x] Customer login and logout
- [x] Account-based authentication configuration
- [x] Basic customer dashboard
- [x] Profile form customization

### In Progress / Upcoming
- [ ] Role-based access control
- [ ] Customer dashboard customization
- [ ] Rental staff/owner dashboard
- [ ] Administrator dashboard
- [ ] Vehicle listing and management
- [ ] Vehicle search and availability
- [ ] Online booking system
- [ ] Document upload and verification
- [ ] Payment management
- [ ] Booking extensions and cancellations
- [ ] Reviews and ratings
- [ ] Penalty management
- [ ] Reports and analytics
- [ ] Public website deployment

## Database

BHLRRide uses PostgreSQL with the following application tables:

1. Accounts
2. Vendors
3. Branches
4. Vehicle Types
5. Vehicles
6. Vehicle Photos
7. Bookings
8. Booking Extensions
9. Payments
10. Documents
11. Reviews
12. Penalties

Additional tables are provided by Laravel for authentication, sessions, caching, and background jobs.

## Local Installation

### Requirements
- PHP 8.2 or higher
- Composer
- Node.js and npm
- PostgreSQL database
- Git

### Setup Instructions

**1. Clone the repository**

```bash
git clone https://github.com/shinyuuuuu/BHLRRide.git
cd BHLRRide
```

**2. Install dependencies**

```bash
composer install
npm install
```

**3. Configure the environment**

```bash
cp .env.example .env
php artisan key:generate
```

Update the `.env` file with your PostgreSQL connection details.

**4. Run database migrations**

```bash
php artisan migrate
```

**5. Build frontend assets**

```bash
npm run build
```

**6. Start the Laravel server**

```bash
php artisan serve
```

Open http://127.0.0.1:8000 in your browser.

## Current Application Pages

| Page | Local URL |
|---|---|
| Homepage | http://127.0.0.1:8000 |
| Registration | http://127.0.0.1:8000/register |
| Login | http://127.0.0.1:8000/login |
| Dashboard | http://127.0.0.1:8000/dashboard |
| Profile | http://127.0.0.1:8000/profile |

These URLs require the Laravel development server to be running locally. Some pages require authentication.

## Security Notes

- Never commit the `.env` file or database credentials.
- Use environment variables for sensitive configuration.
- Only authorized users should access protected system features.
- Security testing and dependency vulnerability reviews are required before public deployment.

## Project Status

**Status:** Under Development

The database structure and basic customer authentication have been implemented. Development will continue with role-based access control and the main rental management features.

## GitHub Repository

https://github.com/shinyuuuuu/BHLRRide

---

**BHLRRide – Making car and motorcycle rental management more organized and accessible in Bohol.**