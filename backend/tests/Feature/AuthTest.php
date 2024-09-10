<?php
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

// Uses the RefreshDatabase trait to clean up after each test
uses(RefreshDatabase::class);

it('can login', function () {
    $user = User::factory()->create([
        'password' => Hash::make('password'),
    ]);


    $response = $this->postJson('/auth/login', [
        'email' => $user->email,
        'password' => 'password'
    ]);

    $response->dump();
    $response->assertSuccessful();

    $this->assertAuthenticatedAs($user);
});

it('can register', function () {

    $password = fake()->password(8);

    $response = $this->postJson('/auth/register', [
        'name' => fake()->name(),
        'email' => fake()->unique()->safeEmail(),
        'password' => $password,
        'password_confirmation' => $password,
    ]);

    $response->dump();
    $response->assertSuccessful();

    $this->assertAuthenticated();
});

