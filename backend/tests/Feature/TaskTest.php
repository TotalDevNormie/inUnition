<?php

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;

uses(DatabaseTransactions::class);

describe('Gets tasks', function () {
    it('doesn\'t get tasks if not authenticated', function () {
        $response = $this->postJson('/api/tasks');

        $response->assertStatus(401);
    });

    it('gets tasks ', function () {
        $user = User::factory()->create();
        $token = auth()->tokenById($user->id);
        $tasks = Task::factory(['user_id' => $user->id])->count(3)->create();

        $response = $this->postJson('/api/tasks', [], [
            'Accept' => 'application/json',
            'Authorization' => 'Bearer ' . $token
        ]);

        $response->assertOk()
            ->assertJsonCount(3, 'tasks');
    });
});

describe('Saves tasks', function () {
    it('can\'t save tasks without auth', function () {
        $task = Task::factory()->make();
        $response = $this->postJson('/api/tasks/save', $task->toArray());
        $response->assertUnauthorized();
    });

    it('saves tasks', function () {
        $user = User::factory()->create();
        $task = Task::factory()
            ->state(['user_id' => $user->id])
            ->make();
        $response = $this->postJson('/api/tasks/save', $task->toArray(), [
            'Accept' => 'application/json',
            'Authorization' => 'Bearer ' . auth()->tokenById($user->id)
        ]);
        $response->assertOk();
        assertDatabaseHas('tasks', $task->toArray());
    });

    it('updates tasks', function () {
        $user = User::factory()->create();
        $task = Task::factory()
            ->state(['user_id' => $user->id])
            ->make();
        $response = $this->postJson('/api/tasks/save', $task->toArray(), [
            'Accept' => 'application/json',
            'Authorization' => 'Bearer ' . auth()->tokenById($user->id)
        ]);
        $response->assertOk();
        assertDatabaseHas('tasks', $task->toArray());
    });
});

describe('Deletes tasks', function () {
    it('can\'t delete tasks without auth', function () {
        $response = $this->postJson('/api/tasks/delete');
        $response->assertUnauthorized();
    });

    it('deletes tasks', function () {
        $user = User::factory()->create();
        $task = Task::factory()
            ->state(['user_id' => $user->id])
            ->create();
        $response = $this->postJson('/api/tasks/delete', $task->toArray(), [
            'Accept' => 'application/json',
            'Authorization' => 'Bearer ' . auth()->tokenById($user->id)
        ]);
        $response->assertOk();
        assertDatabaseMissing('tasks', $task->toArray());
    });
});