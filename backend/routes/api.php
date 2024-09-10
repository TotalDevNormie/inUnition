<?php
use App\Http\Controllers\AuthController;
use App\Http\Controllers\NoteController;


Route::group(['middleware' => 'api', 'prefix' => 'auth'], function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::group(['middleware' => 'auth'], function () {
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

Route::group(['middleware' => 'api:auth', 'prefix' => 'api'], function () {
    Route::get('get-notes', [NoteController::class, 'getNotes']);
});
