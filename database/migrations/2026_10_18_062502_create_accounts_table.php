<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();

            // Personal information
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('last_name', 100);

            // Login credentials
            $table->string('email')->unique();
            $table->string('password');
            $table->string('phone', 30)->nullable();

            // Account permissions and approval status
            $table->string('role', 20)->default('user');
            $table->string('account_status', 20)->default('active');

            // Laravel authentication support
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();

            // Created and updated timestamps
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};