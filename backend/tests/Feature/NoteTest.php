<?php

namespace Tests\Feature;
use App\Models\Note;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;
use function Pest\Laravel\postJson;
use function Pest\Laravel\withHeader;

uses(DatabaseTransactions::class);

describe('Gets Notes', function () {

    it('can\'t get without auth', function () {
        $response = postJson('/api/notes/');

        $response->assertUnauthorized();
    });

    it('gets notes', function () {
        $user = User::factory()->create();

        $token = auth()->tokenById($user->id);

        $response = withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/notes/');

        $response->assertOk();
    });
});

describe('Saves Notes', function () {
    it('can\'t save without auth', function () {
        $note = Note::factory()->make();

        $response = postJson('/api/notes/save', $note->toArray());

        $response->assertUnauthorized();
        assertDatabaseMissing('notes', $note->toArray());
    });

    it('saves note', function () {
        $user = User::factory()->create();

        $now = now();

        $note = Note::factory()->make([
            'user_id' => $user->id
        ]);

        $token = auth()->tokenById($user->id);

        $response = withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/notes/save', $note->toArray());

        $response->assertOk();

        $this->assertDatabaseHas('notes', [
            'title' => $note['title'],
            'content' => $note['content'],
            'uuid' => $note['uuid'],
            'user_id' => $user->id
        ]);
    });

    it('can\'t save without uuid', function () {
        $user = User::factory()->create();
        $note = Note::factory(['user_id' => $user->id])->make();
        $note->uuid = null;

        $token = auth()->tokenById($user->id);

        $response = withHeader('Authorization', 'Bearer ' . $token)->postJson('/api/notes/save', $note->toArray());

        $response->assertUnprocessable();
        assertDatabaseMissing('notes', $note->toArray());
    });

    it('updates note', function () {
        $user = User::factory()->create();

        $now = now();

        $oldNote = Note::factory()->create([
            'user_id' => $user->id
        ]);

        $newNote = $oldNote->toArray();
        $newNote['title'] = 'new title';
        $newNote['content'] = 'new content';


        $token = auth()->tokenById($user->id);

        $response = withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/notes/save', $newNote);

        $response->assertOk();

        $this->assertDatabaseHas('notes', [
            'uuid' => $oldNote->uuid,
            'title' => $newNote['title'],
            'content' => $newNote['content'],
        ]);
    });

});

describe("Deletes Note", function () {
    it('can\'t delete without auth', function () {
        $note = Note::factory()->create();

        $response = postJson('/api/notes/delete', ['uuid' => $note->uuid]);

        $response->assertUnauthorized();
        assertDatabaseHas('notes', $note->toArray());
    });

    it('deletes note', function () {
        $user = User::factory()->create();
        $note = Note::factory(['user_id' => $user->id])->create();

        $token = auth()->tokenById($user->id);

        $response = withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/notes/delete', ['uuid' => $note->uuid]);

        $response->assertOk();
        assertDatabaseMissing('notes', $note->toArray());
    });
});