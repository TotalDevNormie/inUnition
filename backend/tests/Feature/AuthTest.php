<?php
use App\Models\User;

it('can register', function () {

    $response = $this->postJson('/api/register', [
        'name' => fake()->name(),
        'email' => fake()->unique()->safeEmail(),
        'password' => fake()->password(),
    ]);

    $response->dump();
    $response->assertSuccessful();
});

it('can login', function () {
    $user = User::factory()->create();


    $response = $this->postJson('/api/login', $user->only('email', 'password'));

    $response->dump();
    $response->assertSuccessful();
});