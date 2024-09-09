<?php
use App\Http\Controllers\AuthController;
use App\Http\Controllers\NoteController;


Route::group(['middleware' => 'api', 'prefix' => 'api'], function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    Route::group(['middleware' => 'auth'], function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::get('get-user', [AuthController::class, 'userData']);

        Route::get('get-notes', [NoteController::class, 'getNotes']);
    });
});
