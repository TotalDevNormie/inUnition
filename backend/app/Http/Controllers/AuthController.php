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
            return response()->json($validator->errors()->toJson(), 400);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
        ]);

        $token = auth()->tokenById($user->id);

        return response()->json([
            'user' => $user,
            'token' => $token
        ], 201);
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
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Generate refresh token
        $refreshToken = $this->generateRefreshToken(auth()->user()->id);

        return $this->respondWithTokens($token, $refreshToken);
    }

    /**
     * Get the authenticated User.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function me()
    {
        $user = auth()->user();
        $newAccessToken = auth()->refresh();
        $newRefreshToken = $this->generateRefreshToken($user->id);

        // Delete the old refresh token
        DB::table('refresh_tokens')->where('user_id', $user->id)->delete();

        return $this->respondWithTokens($newAccessToken, $newRefreshToken, $user);
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
     * Refresh a token using the access token.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function refresh()
    {
        return $this->respondWithTokens(auth()->refresh());
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
            return response()->json(['error' => 'Invalid or expired refresh token'], 401);
        }

        // Generate new access token and refresh token
        auth()->login(User::find($tokenData->user_id));
        $newAccessToken = auth()->tokenById($tokenData->user_id);
        $newRefreshToken = $this->generateRefreshToken($tokenData->user_id);

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
    private function generateRefreshToken($userId)
    {
        $refreshToken = bin2hex(random_bytes(40)); // Generate random refresh token
        $expiresAt = Carbon::now()->addDays(30);  // Refresh token expiration (30 days)

        // Store refresh token in the database
        DB::table('refresh_tokens')->insert([
            'user_id' => $userId,
            'token' => $refreshToken,
            'expires_at' => $expiresAt
        ]);

        return $refreshToken;
    }

    /**
     * Respond with both access and refresh tokens.
     *
     * @param  string $accessToken
     * @param  string $refreshToken
     * @param  User $user
     * @return \Illuminate\Http\JsonResponse
     */
    protected function respondWithTokens($accessToken, $refreshToken = null, $user = null)
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
