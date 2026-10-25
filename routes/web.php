<?php

use App\Http\Controllers\Api\Admin\VendorController as AdminVendorController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\Api\VendorApplicationController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::prefix('api')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/vehicles', [VehicleController::class, 'index']);
    Route::get('/vehicles/{vehicle}/availability', [BookingController::class, 'availability'])->whereNumber('vehicle');

    Route::get('/vehicles/{vehicle}/reviews', [ReviewController::class, 'forVehicle'])->whereNumber('vehicle');
    Route::post('/webhooks/paymongo', [PaymentController::class, 'webhook']);

    Route::post('/vendor-applications', [VendorApplicationController::class, 'store'])->middleware('throttle:5,1');

    Route::middleware('auth')->group(function () {
        Route::patch('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/password', [AuthController::class, 'changePassword'])->middleware('throttle:6,1');

        Route::get('/bookings', [BookingController::class, 'index']);
        Route::post('/bookings', [BookingController::class, 'store'])->middleware('throttle:20,1');
        Route::patch('/bookings/{id}', [BookingController::class, 'update']);

        Route::get('/payments', [PaymentController::class, 'index']);
        Route::post('/bookings/{id}/pay', [PaymentController::class, 'start'])->middleware('throttle:10,1');
        Route::post('/payments/{id}/verify', [PaymentController::class, 'verify'])->middleware('throttle:30,1');

        Route::post('/reviews', [ReviewController::class, 'store'])->middleware('throttle:20,1');

        Route::post('/vehicles', [VehicleController::class, 'store'])->middleware('role:vendor');
        Route::patch('/vehicles/{vehicle}', [VehicleController::class, 'update'])->middleware('role:vendor,admin')->whereNumber('vehicle');
        Route::delete('/vehicles/{vehicle}', [VehicleController::class, 'destroy'])->middleware('role:vendor,admin')->whereNumber('vehicle');

        Route::middleware('role:admin')->prefix('admin')->group(function () {
            Route::get('/vendors', [AdminVendorController::class, 'index']);
            Route::patch('/vendors/{id}', [AdminVendorController::class, 'update']);
        });
    });
});

Route::redirect('/', '/app/');
Route::get('/app/{path?}', fn () => response()->file(public_path('app/index.html')))->where('path', '.*');

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');

    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
});

require __DIR__.'/auth.php';