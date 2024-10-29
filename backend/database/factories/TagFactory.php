<?php

namespace Database\Factories;

use App\Models\Tag;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TagFactory extends Factory
{
    protected $model = Tag::class;

    public function definition()
    {
        return [
            'id' => null, // Auto-incrementing
            'user_id' => User::factory(),
            'name' => $this->faker->word(),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    /**
     * Configure the factory to create a tag with a related note.
     */
    public function withNote()
    {
        return $this->afterCreating(function (Tag $tag) {
            \App\Models\NoteTag::create([
                'tag_id' => $tag->id,
                'note_uuid' => \App\Models\Note::factory()->create([
                    'user_id' => $tag->user_id
                ])->uuid
            ]);
        });
    }

    /**
     * Configure the factory to create a tag with a related task group.
     */
    public function withTaskGroup()
    {
        return $this->afterCreating(function (Tag $tag) {
            \App\Models\TaskGroupTag::create([
                'tag_id' => $tag->id,
                'task_group_uuid' => \App\Models\TaskGroup::factory()->create([
                    'user_id' => $tag->user_id
                ])->uuid
            ]);
        });
    }
}