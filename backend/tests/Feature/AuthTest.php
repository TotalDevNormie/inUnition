<?php
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use function Pest\Laravel\assertAuthenticated;
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

it('registers', function () {
    $password = fake()->password(8);

    $response = postJson('/api/auth/register', [
        'name' => fake('lv_LV')->name(),
        'email' => fake()->unique()->safeEmail(),
        'password' => $password,
        'password_confirmation' => $password,
    ]);

    $response->assertSuccessful();
});

it('logs out', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $response = postJson('/api/auth/logout');

    $response->assertSuccessful();

    $this->assertCount(0, $user->tokens);
});
