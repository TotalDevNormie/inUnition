<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{

    /**
     * Handle an authentication attempt.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');

        if (auth()->attempt($credentials)) {
            $user = auth()->user();
            $token = $user->createToken($user->name . '-AuthToken')->plainTextToken;

            return response()->json([
                'token' => $token,
                'user' => $user->only('email', 'name')
            ]);
        } else {
            return response()->json([
                'message' => 'Email or password is incorrect'
            ], 401);
        }
    }

    /**
     * Remove the token of the logged in user.
     *
     * @param \Illuminate\Http\Request $request
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Register a new user
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'messages' => $e->errors(),
            ], 422);
        }

        $user = User::create([
            'name' => $validatedData['name'],
            'email' => $validatedData['email'],
            'password' => bcrypt($validatedData['password']),
        ]);

        $token = $user->createToken('Laravel Password Grant Client')->accessToken;

        return response()->json([
            'token' => $token
        ]);
    }



    /**
     * Get the authenticated user.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()
        ]);
    }
}
