<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * The original vehicles migration only created id + timestamps, so the
 * table was missing every real column. This adds them. Each column is
 * checked first, so it is safe on a fresh database and on the live one.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            if (! Schema::hasColumn('vehicles', 'branch_id')) {
                $table->foreignId('branch_id')->nullable()->constrained('branches')->restrictOnDelete();
            }
            if (! Schema::hasColumn('vehicles', 'vehicle_type_id')) {
                $table->foreignId('vehicle_type_id')->nullable()->constrained('vehicle_types')->restrictOnDelete();
            }
            if (! Schema::hasColumn('vehicles', 'brand')) {
                $table->string('brand', 100)->default('');
            }
            if (! Schema::hasColumn('vehicles', 'model')) {
                $table->string('model', 100)->default('');
            }
            if (! Schema::hasColumn('vehicles', 'plate_number')) {
                $table->string('plate_number', 30)->nullable()->unique();
            }
            if (! Schema::hasColumn('vehicles', 'rental_rate')) {
                $table->decimal('rental_rate', 10, 2)->default(0);
            }
            if (! Schema::hasColumn('vehicles', 'status')) {
                $table->string('status', 30)->default('available');
            }
            if (! Schema::hasColumn('vehicles', 'description')) {
                $table->text('description')->nullable();
            }
            if (! Schema::hasColumn('vehicles', 'kind')) {
                $table->string('kind', 20)->default('Car');
            }
            if (! Schema::hasColumn('vehicles', 'style')) {
                $table->string('style', 50)->nullable();
            }
            if (! Schema::hasColumn('vehicles', 'transmission')) {
                $table->string('transmission', 20)->nullable();
            }
            if (! Schema::hasColumn('vehicles', 'seats')) {
                $table->unsignedSmallInteger('seats')->default(5);
            }
            if (! Schema::hasColumn('vehicles', 'fuel')) {
                $table->string('fuel', 20)->nullable();
            }
            if (! Schema::hasColumn('vehicles', 'badge')) {
                $table->string('badge', 100)->nullable();
            }
            if (! Schema::hasColumn('vehicles', 'image')) {
                $table->string('image', 255)->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            foreach (['branch_id', 'vehicle_type_id'] as $fk) {
                if (Schema::hasColumn('vehicles', $fk)) {
                    $table->dropConstrainedForeignId($fk);
                }
            }
            foreach (['brand', 'model', 'plate_number', 'rental_rate', 'status', 'description',
                      'kind', 'style', 'transmission', 'seats', 'fuel', 'badge', 'image'] as $col) {
                if (Schema::hasColumn('vehicles', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
