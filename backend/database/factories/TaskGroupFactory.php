<?php

namespace Database\Factories;

use App\Models\TaskGroup;
use App\Models\TaskStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TaskGroup>
 */
class TaskGroupFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'uuid' => fake()->uuid(),
            'name' => substr(fake()->sentence(3), 0, 50),
            'description' => fake()->paragraph(1, true),
            'created_at' => now()->toISOString(),
            'updated_at' => now()->toISOString(),
            'task_statuses' => json_encode(['Todo', 'Doing', 'Done']),
            'user_id' => User::factory()->create()->id,
        ];
    }
}
