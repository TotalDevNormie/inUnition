<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('task_group_tags', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('task_group_uuid')->constrained('task_groups', 'uuid')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_group_tags');
    }
};
