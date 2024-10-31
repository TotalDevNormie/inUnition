<?php

namespace Tests\Feature;
use App\Models\DeletedEntries;
use App\Models\TaskGroup;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use function Pest\Laravel\assertDatabaseMissing;
use function Pest\Laravel\assertNotSoftDeleted;
use function Pest\Laravel\postJson;
use function Pest\Laravel\withHeader;
use function PHPUnit\Framework\assertTrue;

uses(DatabaseTransactions::class);

describe("Gets Task Groups", function () {
    it('can\'t get without auth', function () {
        $response = postJson('/api/task-groups/');

        $response->assertUnauthorized();
    });

    it('gets task groups', function () {
        $user = User::factory()->create();
        $token = auth()->tokenById($user->id);
        // Create some task groups for this user
        TaskGroup::factory()
            ->count(3)
            ->create(['user_id' => $user->id]);

        // Create a task group for another user (shouldn't be returned)
        TaskGroup::factory()->create();

        $response = withHeader('Authorization', 'Bearer ' . $token)->postJson('/api/task-groups');

        $response->assertOk()
            ->dump()
            ->assertJsonCount(3, 'taskGroups')
            ->assertJsonStructure([
                'taskGroups' => [
                    '*' => [
                        'uuid',
                        'name',
                        'description',
                        'user_id',
                        'created_at',
                        'updated_at',
                        'task_statuses'
                    ]
                ],
                'deleted'
            ]);
    });

    it('gets task groups after timestamp', function () {
        $user = User::factory()->create();
        $token = auth()->tokenById($user->id);

        // Create old task groups
        TaskGroup::factory()
            ->count(2)
            ->create([
                'user_id' => $user->id,
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2)
            ]);

        // Create new task groups
        TaskGroup::factory()
            ->count(3)
            ->create([
                'user_id' => $user->id,
                'created_at' => now(),
                'updated_at' => now()
            ]);

        $timestamp = now()->subDay()->toISOString();
        $response = withHeader('Authorization', 'Bearer ' . $token)->postJson("/api/task-groups?timestamp={$timestamp}");

        $response->assertOk()
            ->assertJsonCount(3, 'taskGroups');
    });

    it('includes deleted task groups', function () {
        $user = User::factory()->create();
        $token = auth()->tokenById($user->id);

        // Create a deleted entry
        DeletedEntries::create([
            'user_id' => $user->id,
            'type' => 'taskGroup',
            'entry_id' => fake()->uuid(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $response = withHeader('Authorization', 'Bearer ' . $token)->postJson('/api/task-groups');


        $response->assertOk()
            ->assertJsonCount(1, 'deleted');
    });

});

describe("Saves Task Groups", function () {
    it('can\'t save without auth', function () {
        $taskGroup = TaskGroup::factory()->make();
        $response = postJson('/api/task-groups/', $taskGroup->toArray());
        $response->assertUnauthorized();
        assertTrue(true);
    });

    it('saves task group', function () {
        $user = User::factory()->create();
        $taskGroup = TaskGroup::factory()
            ->state(['user_id' => $user->id])
            ->make();
        $taskGroupArray = $taskGroup->toArray();
        $taskGroupArray['task_statuses'] = ['new status', 'other status'];


        $token = auth()->tokenById($user->id);
        $response = withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/task-groups/save', $taskGroupArray);
        $response->assertOk();
        $this->assertDatabaseHas('task_groups', [
            'uuid' => $taskGroup->uuid,
            'task_statuses' => json_encode($taskGroupArray['task_statuses']),
            'user_id' => $user->id,
            'name' => $taskGroupArray['name'],
            'description' => $taskGroupArray['description'],
        ]);
    });


    it('updates task group', function () {
        $user = User::factory()->create();
        $taskGroup = TaskGroup::factory()
            ->state(['user_id' => $user->id])
            ->make();
        $taskGroupArray = $taskGroup->toArray();
        $taskGroupArray['task_statuses'] = ['new status', 'other status'];

        $token = auth()->tokenById($user->id);
        $response = withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/task-groups/save', $taskGroupArray);
        $response->assertOk();
        $this->assertDatabaseHas('task_groups', [
            'uuid' => $taskGroup->uuid,
            'task_statuses' => json_encode($taskGroupArray['task_statuses']),
            'user_id' => $user->id,
            'name' => $taskGroupArray['name'],
            'description' => $taskGroupArray['description'],
        ]);
    });
});

describe("Deletes Task Groups", function () {
    it('can\'t delete without auth', function () {
        $response = postJson('/api/task-groups/delete');
        $response->assertUnauthorized();
        assertTrue(true);
    });

    it('deletes task group', function () {
        $user = User::factory()->create();
        $taskGroup = TaskGroup::factory()
            ->state(['user_id' => $user->id])
            ->create();
        $token = auth()->tokenById($user->id);
        $response = withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/task-groups/delete', [
                'uuid' => $taskGroup->uuid
            ]);
        $response->assertOk();
        assertDatabaseMissing('task_groups', [
            'uuid' => $taskGroup->uuid
        ]);
    });
});
