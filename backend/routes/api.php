<?php

use App\Http\Controllers\NoteController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TaskGroupController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::group([
    'middleware' => 'api',
    'prefix' => 'auth'
], function () {
    Route::post('/register', [AuthController::class, 'register'])->name('register');
    Route::post('/login', [AuthController::class, 'login'])->name('login');
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:api')->name('logout');
    Route::post('/refresh', [AuthController::class, 'refreshToken'])->name('refresh');
    Route::post('/me', [AuthController::class, 'me'])->middleware('auth:api')->name('me');
});

Route::group(['middleware' => ['api', 'auth']], function () {
    Route::group(['prefix' => 'notes'], function () {
        Route::post('/save', [NoteController::class, 'saveNote']);
        Route::post('/delete', [NoteController::class, 'deleteNote']);
        Route::post('/', [NoteController::class, 'getNotes']);
    });

    Route::group(['prefix' => 'task-groups'], function () {
        Route::post('/', [TaskGroupController::class, 'getTaskGroups']);
        Route::post('/save', [TaskGroupController::class, 'saveTaskGroup']);
        Route::post('/delete', [TaskGroupController::class, 'deleteTaskGroup']);
    });

    Route::group(['prefix' => 'tasks'], function () {
        Route::post('/', [TaskController::class, 'getTasks']);
        Route::post('/save', [TaskController::class, 'saveTask']);
        Route::post('/delete', [TaskController::class, 'deleteTask']);
    });

    Route::group(['prefix' => 'tags'], function () {
        Route::post('/', [TagController::class, 'getTags']);
        Route::post('/save', [TagController::class, 'saveTags']);
        Route::post('/delete', [TagController::class, 'deleteTag']);
    });
});
