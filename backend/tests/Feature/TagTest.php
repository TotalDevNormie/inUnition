<?php

namespace Tests\Feature;

use App\Models\Tag;
use App\Models\User;
use App\Models\Note;
use App\Models\TaskGroup;
use App\Models\NoteTag;
use App\Models\TaskGroupTag;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;
use function Pest\Laravel\postJson;
use function Pest\Laravel\withHeader;

uses(DatabaseTransactions::class);

// describe('Gets Tags', function () {
//     it('can\'t get without auth', function () {
//         $response = postJson('/api/tags/');
//         $response->assertUnauthorized();
//     });

//     it('gets tags', function () {
//         $user = User::factory()->create();
//         $token = auth()->tokenById($user->id);
//         $response = withHeader('Authorization', 'Bearer ' . $token)
//             ->postJson('/api/tags/');
//         $response->assertOk();
//     });

//     it('gets tags with relationships', function () {
//         $user = User::factory()->create();
//         $tag = Tag::factory()->create(['user_id' => $user->id]);
//         $note = Note::factory()->create(['user_id' => $user->id]);
//         $taskGroup = TaskGroup::factory()->create(['user_id' => $user->id]);

//         NoteTag::create([
//             'tag_id' => $tag->id,
//             'note_uuid' => $note->uuid
//         ]);

//         TaskGroupTag::create([
//             'tag_id' => $tag->id,
//             'task_group_uuid' => $taskGroup->uuid
//         ]);

//         $token = auth()->tokenById($user->id);
//         $response = withHeader('Authorization', 'Bearer ' . $token)
//             ->postJson('/api/tags/');

//         $response->dump();

//         $response->assertOk()
//             ->assertJsonStructure([
//                 'tags' => [
//                     '*' => [
//                         '*' => [
//                             'id',
//                             'type',
//                             'created_at',
//                             'updated_at'
//                         ]
//                     ]
//                 ]
//             ]);
//     });
// });

// describe('Saves Tags', function () {
//     it('can\'t save without auth', function () {
//         $note = Note::factory()->create();
//         $tagData = [
//             'type' => 'note',
//             'parent_uuid' => $note->uuid
//         ];

//         $response = postJson('/api/tags/save', ['tags' => [$note->uuid => [$tagData]]]);
//         $response->assertUnauthorized();
//     });

//     it('saves note tag', function () {
//         $user = User::factory()->create();
//         $note = Note::factory()->create(['user_id' => $user->id]);

//         $tagData = [
//             'type' => 'note',
//             'parent_uuid' => $note->uuid,
//             'created_at' => now()->toISOString(),
//             'updated_at' => now()->toISOString()
//         ];

//         $token = auth()->tokenById($user->id);
//         $response = withHeader('Authorization', 'Bearer ' . $token)
//             ->postJson('/api/tags/save', ['tags' => [$note->uuid => [$tagData]]]);

//         $response->assertOk();

//         $tag = Tag::latest()->first();
//         $this->assertNotNull($tag);

//         assertDatabaseHas('note_tags', [
//             'tag_id' => $tag->id,
//             'note_uuid' => $note->uuid
//         ]);
//     });

//     it('saves task group tag', function () {
//         $user = User::factory()->create();
//         $taskGroup = TaskGroup::factory()->create(['user_id' => $user->id]);

//         $tagData = [
//             'type' => 'taskGroup',
//             'parent_uuid' => $taskGroup->uuid,
//             'created_at' => now()->toISOString(),
//             'updated_at' => now()->toISOString()
//         ];

//         $token = auth()->tokenById($user->id);
//         $response = withHeader('Authorization', 'Bearer ' . $token)
//             ->postJson('/api/tags/save', ['tags' => [$taskGroup->uuid => [$tagData]]]);

//         $response->assertOk();

//         $tag = Tag::latest()->first();
//         $this->assertNotNull($tag);

//         assertDatabaseHas('task_group_tags', [
//             'tag_id' => $tag->id,
//             'task_group_uuid' => $taskGroup->uuid
//         ]);
//     });

//     it('updates tag relationships', function () {
//         $user = User::factory()->create();
//         $oldNote = Note::factory()->create(['user_id' => $user->id]);
//         $newNote = Note::factory()->create(['user_id' => $user->id]);
//         $tag = Tag::factory()->create(['user_id' => $user->id]);

//         NoteTag::create([
//             'tag_id' => $tag->id,
//             'note_uuid' => $oldNote->uuid
//         ]);

//         $tagData = [
//             'id' => $tag->id,
//             'type' => 'note',
//             'parent_uuid' => $newNote->uuid,
//             'updated_at' => now()->addHour()->toISOString()
//         ];

//         $token = auth()->tokenById($user->id);
//         $response = withHeader('Authorization', 'Bearer ' . $token)
//             ->postJson('/api/tags/save', ['tags' => [$newNote->uuid => [$tagData]]]);

//         $response->assertOk();
//         assertDatabaseHas('note_tags', [
//             'tag_id' => $tag->id,
//             'note_uuid' => $newNote->uuid
//         ]);
//     });
// });

// describe('Deletes Tag', function () {
//     it('can\'t delete without auth', function () {
//         $tag = Tag::factory()->create();
//         $response = postJson('/api/tags/delete', ['id' => $tag->id]);
//         $response->assertUnauthorized();
//         assertDatabaseHas('tags', ['id' => $tag->id]);
//     });

//     it('deletes tag and relationships', function () {
//         $user = User::factory()->create();
//         $tag = Tag::factory(['user_id' => $user->id])->create();
//         $note = Note::factory()->create(['user_id' => $user->id]);
//         $taskGroup = TaskGroup::factory()->create(['user_id' => $user->id]);

//         NoteTag::create([
//             'tag_id' => $tag->id,
//             'note_uuid' => $note->uuid
//         ]);

//         TaskGroupTag::create([
//             'tag_id' => $tag->id,
//             'task_group_uuid' => $taskGroup->uuid
//         ]);

//         $token = auth()->tokenById($user->id);
//         $response = withHeader('Authorization', 'Bearer ' . $token)
//             ->postJson('/api/tags/delete', ['id' => $tag->id]);

//         $response->assertOk();
//         assertDatabaseMissing('tags', ['id' => $tag->id]);
//         assertDatabaseMissing('note_tags', ['tag_id' => $tag->id]);
//         assertDatabaseMissing('task_group_tags', ['tag_id' => $tag->id]);
//         assertDatabaseHas('deleted_entries', [
//             'id' => $tag->id,
//             'type' => 'tag'
//         ]);
//     });
// });