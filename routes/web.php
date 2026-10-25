<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\VehicleController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::prefix('api')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/vehicles', [VehicleController::class, 'index']);
    Route::get('/vehicles/{vehicle}/availability', [BookingController::class, 'availability'])->whereNumber('vehicle');

    Route::middleware('auth')->group(function () {
        Route::get('/bookings', [BookingController::class, 'index']);
        Route::post('/bookings', [BookingController::class, 'store'])->middleware('throttle:20,1');
        Route::patch('/bookings/{id}', [BookingController::class, 'update']);
    });
});

Route::redirect('/', '/app/');
Route::get('/app/{path?}', fn () => response()->file(public_path('app/index.html')))->where('path', '.*');

Route::get('/', function () {
    return view('welcome');
});

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');

    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
});

require __DIR__.'/auth.php';