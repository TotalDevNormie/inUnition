<?php
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use function Pest\Laravel\assertAuthenticatedAs;
use function Pest\Laravel\assertGuest;
use function Pest\Laravel\postJson;

it('logs in', function () {
    $password = fake()->password(8);
    $user = User::factory()->create([
        'password' => Hash::make($password),
    ]);
    $response = postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => $password,
    ]);
    echo $response->getStatusCode();
    $response->assertSuccessful();
    assertAuthenticatedAs($user);
});

it('fails to log in', function () {
    $password = fake()->password(8);
    $user = User::factory()->create([
        'password' => Hash::make($password),
    ]);
    $response = postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => $password . 'wrong',
    ]);
    $response->assertStatus(401);
});

it('logs out', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user, ['*']);
    $user->createToken('test')->plainTextToken;
    // dd($user->tokens);

    $response = $this->postJson('/api/auth/logout');

    $response->dump();

    $response->assertSuccessful();


    $this->assertCount(0, $user->tokens);
});
