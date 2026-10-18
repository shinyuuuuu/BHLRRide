<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendors', function (Blueprint $table) {
            $table->id();

            $table->foreignId('account_id')
                ->unique()
                ->constrained('accounts')
                ->cascadeOnDelete();

            $table->string('business_name', 150);
            $table->string('business_address', 255)->nullable();
            $table->string('business_phone', 30)->nullable();

            $table->string('approval_status', 20)->default('pending');
            $table->foreignId('approved_by')
                ->nullable()
                ->constrained('accounts')
                ->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendors');
    }
};