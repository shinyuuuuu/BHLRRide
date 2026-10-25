<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Branch;
use App\Models\Vehicle;
use App\Models\VehicleType;
use App\Models\Vendor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/*
 * Puts the sample fleet from the React demo into the database.
 * Safe to run more than once (it updates instead of duplicating).
 *   php artisan db:seed --class=VehicleSeeder
 *
 * The three shop owner accounts are placeholders with random, unknown
 * passwords, so nobody can log in as them.
 */
class VehicleSeeder extends Seeder
{
    public function run(): void
    {
        $shops = [
            'Bohol Wheels'     => ['slug' => 'bohol-wheels',  'branch' => 'Tagbilaran City'],
            'Panglao Ride Hub' => ['slug' => 'panglao-ride-hub', 'branch' => 'Panglao'],
            'Loboc Riders'     => ['slug' => 'loboc-riders',  'branch' => 'Loboc'],
        ];

        $branchIds = [];
        foreach ($shops as $name => $info) {
            $account = Account::firstOrCreate(
                ['email' => $info['slug'].'@seed.invalid'],
                [
                    'first_name'     => $name,
                    'last_name'      => 'Owner',
                    'password'       => Str::random(40),
                    'role'           => 'vendor',
                    'account_status' => 'active',
                ]
            );

            $vendor = Vendor::firstOrCreate(
                ['account_id' => $account->id],
                ['business_name' => $name, 'approval_status' => 'approved']
            );

            $branch = Branch::firstOrCreate(
                ['vendor_id' => $vendor->id, 'branch_name' => $info['branch']],
                ['branch_address' => $info['branch'].', Bohol']
            );

            $branchIds[$name] = $branch->id;
        }

        $vehicles = [
            ['Toyota', 'Vios',      'ABC 1234', 'Bohol Wheels',     'Car',        'Sedan',     'Automatic', 5,  'Petrol', 1500, 'Weekend favourite',   '/images/toyotaVios.jpg',   true],
            ['Toyota', 'Wigo',      'ABC 2345', 'Bohol Wheels',     'Car',        'Hatchback', 'Manual',    5,  'Petrol', 1200, '',                    '/images/toyotaWigo.webp',  true],
            ['Toyota', 'Innova',    'ABC 3456', 'Panglao Ride Hub', 'Car',        'MPV',       'Manual',    7,  'Diesel', 2500, 'Family pick',         '/images/toyotaInnova.jpg', true],
            ['Toyota', 'Hiace',     'ABC 4567', 'Bohol Wheels',     'Car',        'Van',       'Manual',    12, 'Diesel', 4000, 'Group tours',         '/images/toyotaHiace.webp', true],
            ['Honda',  'Click 125', '123 ABC',  'Panglao Ride Hub', 'Motorcycle', 'Scooter',   'Automatic', 2,  'Petrol', 600,  'Island essential',    '/images/hondaClick.jpg',   true],
            ['Yamaha', 'NMAX',      '234 BCD',  'Bohol Wheels',     'Motorcycle', 'Scooter',   'Automatic', 2,  'Petrol', 900,  '',                    '/images/yamahaNMAX.jpg',   true],
            ['Honda',  'XR150L',    '345 CDE',  'Loboc Riders',     'Motorcycle', 'Adventure', 'Manual',    2,  'Petrol', 800,  'Chocolate Hills runs', '/images/hondaXR150L.jpg', true],
            ['Yamaha', 'Mio i 125', '456 DEF',  'Loboc Riders',     'Motorcycle', 'Scooter',   'Automatic', 2,  'Petrol', 500,  '',                    '/images/yamahaMio.jpg',    false],
        ];

        foreach ($vehicles as [$brand, $model, $plate, $shop, $kind, $style, $trans, $seats, $fuel, $rate, $badge, $image, $available]) {
            $type = VehicleType::firstOrCreate(['type_name' => $style]);

            Vehicle::updateOrCreate(
                ['plate_number' => $plate],
                [
                    'branch_id'       => $branchIds[$shop],
                    'vehicle_type_id' => $type->id,
                    'brand'           => $brand,
                    'model'           => $model,
                    'kind'            => $kind,
                    'style'           => $style,
                    'transmission'    => $trans,
                    'seats'           => $seats,
                    'fuel'            => $fuel,
                    'rental_rate'     => $rate,
                    'badge'           => $badge,
                    'image'           => $image,
                    'status'          => $available ? 'available' : 'unavailable',
                ]
            );
        }
    }
}
