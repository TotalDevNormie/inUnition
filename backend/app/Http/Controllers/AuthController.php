<?php

namespace App\Http\Controllers;

use App\Models\User;
use Carbon\Carbon;
use Hash;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    /**
     * Handle a login request to the application.
     *
     * @param \Illuminate\Http\Request $request
     *
     * @return \Illuminate\Http\Response
     */
    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');

        try {
            if (!$token = Auth::attempt($credentials)) {
                return response()->json(['error' => 'invalid_credentials'], 401);
            }
        } catch (JWTException $e) {
            return response()->json(['error' => 'could_not_create_token'], 500);
        }

        // Generate refresh token
        $refreshToken = $this->createRefreshToken($request->user());

        return response()->json([
            'access_token' => $token,
            'user' => auth()->user()->only('name', 'email'),
            'token_type' => 'bearer',
            'expires_in' => auth()->factory()->getTTL() * 60,
            'refresh_token' => $refreshToken
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $this->login($request);
    }

    /**
     * Handle a refresh token request to the application.
     *
     * @param \Illuminate\Http\Request $request
     *
     * @return \Illuminate\Http\Response
     */
    public function refresh(Request $request)
    {
        $refreshToken = $request->input('refresh_token');

        if (!$refreshToken) {
            return response()->json(['error' => 'Refresh token is required'], 400);
        }

        $user = User::where('refresh_token', $refreshToken)
            ->where('refresh_token_expiry', '>', now())
            ->first();

        if (!$user) {
            return response()->json(['error' => 'Invalid refresh token'], 401);
        }

        try {
            $token = JWTAuth::fromUser($user);
        } catch (JWTException $e) {
            return response()->json(['error' => 'Could not create token'], 500);
        }

        // Generate new refresh token
        $newRefreshToken = $this->createRefreshToken($user);

        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'user' => $user->only('name', 'email'),
            'expires_in' => auth()->factory()->getTTL() * 60,
            'refresh_token' => $newRefreshToken
        ]);
    }

    /**
     * Generate a new refresh token for the given user.
     *
     * @param User $user
     * @return string
     */
    private function createRefreshToken(User $user)
    {
        $refreshToken = \Str::random(60);
        $expiryDate = Carbon::now()->addDays(30);

        $user->update([
            'refresh_token' => $refreshToken,
            'refresh_token_expiry' => $expiryDate
        ]);

        return $refreshToken;
    }

    /**
     * Log the user out (Invalidate the token).
     *
     * @param \Illuminate\Http\Request $request
     *
     * @return \Illuminate\Http\Response
     */
    public function logout(Request $request)
    {
        $user = $request->user();
        $user->update(['refresh_token' => null, 'refresh_token_expiry' => null]);

        auth()->logout();

        return response()->json(['message' => 'Successfully logged out']);
    }

}
