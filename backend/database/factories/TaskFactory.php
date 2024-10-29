<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\User;
use App\Models\TaskGroup;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Task>
 */
class TaskFactory extends Factory
{
    public function definition()
    {
        return [
            'uuid' => $this->faker->uuid,
            'task_group_uuid' => TaskGroup::factory(), // Assumes TaskGroupFactory exists
            'user_id' => User::factory(), // Assumes UserFactory exists
            'status' => $this->faker->randomElement(['Todo', 'Doing', 'Done']),
            'name' => $this->faker->words(3, true), // Generates a short name
            'description' => $this->faker->sentence(10), // Generates a short description
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
