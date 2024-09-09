<?php


Route::group(['middleware' => 'api', 'prefix' => 'api'], function ()  {
    Route::post('login', 'AuthController@login');
    Route::post('logout', 'AuthController@logout');
    Route::post('refresh', 'AuthController@refresh');
    Route::get('get-user', 'AuthController@userData');

    Route::get('get-notes', 'NoteController@getNotes');
});
