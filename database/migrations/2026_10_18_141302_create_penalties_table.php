<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('penalties', function (Blueprint $table) {
            $table->id();

            $table->foreignId('booking_id')
                ->constrained('bookings')
                ->restrictOnDelete();

            $table->string('penalty_type', 50);

            $table->text('description')->nullable();

            $table->decimal('amount', 10, 2);

            $table->string('penalty_status', 30)
                ->default('pending');

            $table->foreignId('issued_by_account_id')
                ->constrained('accounts')
                ->restrictOnDelete();

            $table->timestamp('date_issued')
                ->useCurrent();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('penalties');
    }
};
