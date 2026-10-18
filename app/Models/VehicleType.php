<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();

            $table->foreignId('branch_id')
                ->constrained('branches')
                ->restrictOnDelete();

            $table->foreignId('vehicle_type_id')
                ->constrained('vehicle_types')
                ->restrictOnDelete();

            $table->string('brand', 100);
            $table->string('model', 100);
            $table->string('plate_number', 30)->unique();

            $table->decimal('rental_rate', 10, 2);
            $table->string('status', 30)->default('available');
            $table->text('description')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
