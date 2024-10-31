<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB; // for DB queries
use Validator;
use Carbon\Carbon;

class AuthController extends Controller
{
    /**
     * Register a User.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required',
            'email' => 'required|email|unique:users',
            'password' => 'required|confirmed|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json(['messages' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
        ]);

        $token = auth()->tokenById($user->id);

        $refreshToken = $this->generateRefreshToken($user->id);

        return $this->respondWithTokens($token, $refreshToken, $user);
    }

    /**
     * Get a JWT via given credentials and return access and refresh tokens.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        $credentials = $request->only(['email', 'password']);

        if (!$token = auth()->attempt($credentials)) {
            return response()->json(['message' => 'Email or password is incorrect'], 401);
        }

        // Generate refresh token
        $refreshToken = $this->generateRefreshToken(auth()->user()->id);

        return $this->respondWithTokens($token, $refreshToken, auth()->user());
    }

    /**
     * Get the authenticated User.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function me()
    {
        $user = auth()->user();

        return $this->respondWithTokens(user: $user);
    }

    /**
     * Log the user out (Invalidate the token and delete refresh token).
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout()
    {
        // Invalidate the token and delete refresh token
        $userId = auth()->user()->id;
        auth()->logout();
        DB::table('refresh_tokens')->where('user_id', $userId)->delete();

        return response()->json(['message' => 'Successfully logged out']);
    }

    /**
     * Exchange refresh token for new access token.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function refreshToken(Request $request)
    {
        $refreshToken = $request->input('refresh_token');

        $tokenData = DB::table('refresh_tokens')->where('token', $refreshToken)->first();
        if (!$tokenData || $tokenData->expires_at < Carbon::now()) {
            return response()->json(['message' => 'Invalid or expired refresh token'], 401);
        }

        // Generate new access token and refresh token
        auth()->login(User::find($tokenData->user_id));
        $newAccessToken = auth()->tokenById($tokenData->user_id);
        $authController = new AuthController();

        $newRefreshToken = $authController->generateRefreshToken($tokenData->user_id);

        // Delete the old refresh token
        DB::table('refresh_tokens')->where('token', $refreshToken)->delete();

        return $this->respondWithTokens($newAccessToken, $newRefreshToken);
    }

    /**
     * Generate a new refresh token.
     *
     * @param  int $userId
     * @return string
     */
    public function generateRefreshToken($userId)
    {
        $refreshToken = bin2hex(random_bytes(40)); // Generate random refresh token
        $expiresAt = Carbon::now()->addDays(30);  // Refresh token expiration (30 days)

        // Store refresh token in the database
        DB::table('refresh_tokens')->insert([
            'user_id' => $userId,
            'token' => $refreshToken,
            'expires_at' => $expiresAt
        ]);

        $testToken = DB::table('refresh_tokens')->where('token', $refreshToken)->first()->token;

        return $testToken;
    }

    /**
     * Respond with both access and refresh tokens.
     *
     * @param  string $accessToken
     * @param  string $refreshToken
     * @param  User $user
     * @return \Illuminate\Http\JsonResponse
     */
    protected function respondWithTokens($accessToken = null, $refreshToken = null, $user = null)
    {
        return response()->json([
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'user' => $user,
            'token_type' => 'bearer',
            'expires_in' => auth()->factory()->getTTL() * 60  // JWT expiration time in seconds
        ]);
    }
}
