<?php

namespace Tests\Feature;

use App\Http\Controllers\AuthController;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Exceptions;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use function Pest\Laravel\postJson;

uses(DatabaseTransactions::class);


describe('Register', function () {

    it('registers', function () {
        $password = fake()->password(8);
        $email = fake()->safeEmail();
        $response = $this->postJson('/api/auth/register', [
            'name' => fake('lv_LV')->name(),
            'email' => $email,
            'password' => $password,
            'password_confirmation' => $password,
        ]);

        // $response->dump();
        $response->assertSuccessful();
        $this->assertDatabaseHas('users', [
            'email' => $email,
        ]);

    });

    it('does\'t register', function () {
        $password = fake()->password(4, 4);
        $email = fake()->email();
        $response = $this->postJson('/api/auth/register', [
            'name' => fake('lv_LV')->name(),
            'email' => $email,
            'password' => $password,
            'password_confirmation' => $password,
        ]);

        // $response->dump();
        $response->assertStatus(400);
        $this->assertDatabaseMissing('users', [
            'email' => $email,
        ]);

    });
});

describe("Login", function () {

    it('logs in', function () {

        $user = User::factory()->create();

        // $token = auth()->tokenById($user->id);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertOk();
        // $response->dump();
        expect($response->json()['access_token'])->not()->toBeEmpty();
        expect($response->json()['refresh_token'])->not()->toBeEmpty();
    });

    it('doesn\'t log in with invalid credentials', function () {
        $user = User::factory()->create();

        // $token = auth()->tokenById($user->id);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'wrongPassword',
            // 'token' => $token,
        ]);

        $response->assertStatus(401);
        // $response->dump();
        expect(auth()->user())->toBeEmpty();
    });

});

describe('Auth guard', function () {

    it('gets user data', function () {
        $user = User::factory()->create();

        $token = auth()->tokenById($user->id);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/auth/me');

        $response->assertOk();
        expect($response->json()['user']['email'])->toBe($user->email);
    });

    it('throws JWTException when token cannot be parsed', function () {
        $user = User::factory()->create();
        $token = auth()->tokenById($user->id);
        auth()->invalidate();


        postJson('/api/auth/me', [
            'token' => $token,
        ]);
    })->throws(JWTException::class);

    it('logogs out', function () {
        $user = User::factory()->create();
        $token = auth()->tokenById($user->token);

        $response = $this->actingAs($user)
            ->postJson('/api/auth/logout', [
                'token' => $token,
            ]);

        $response->assertOk();
        expect(auth()->user())->toBeEmpty();
    });

});


it('refreshes tokens', function () {
    $user = User::factory()->create();
    $token = auth()->tokenById($user->id);
    // $userDataResponse = $this->postJson('/api/auth/me', [
    //     'token' => $token,
    // ]);
    $authController = new AuthController();
    $refreshToken = $authController->generateRefreshToken($user->id);
    $this->assertDatabaseHas('refresh_tokens', [
        'user_id' => $user->id,
        'token' => $refreshToken,  // Make sure this matches what is inserted
    ]);
    // print_r($userDataResponse->json());
    $response = $this->postJson('/api/auth/refresh', [
        'refresh_token' => $refreshToken
    ]);
    $response->dump();
    $response->assertOk();
    expect($response->json()['access_token'])->not()->toBeEmpty();
    expect($response->json()['refresh_token'])->not()->toBe($refreshToken);
});

