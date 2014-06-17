<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It's a breeze. Simply tell Laravel the URIs it should respond to
| and give it the Closure to execute when that URI is requested.
|
*/

Route::get('/', function(){
	return "Finally!";
});


Route::get('surveys', function() {
    $surveys = Survey::all();
    return View::make('surveys')->with('surveys', $surveys);
});

Route::get('survey/{id}', function($id) {
    $surveys = Survey::find($id);
    var_dump($surveys->email);
    return View::make('surveys')->with('surveys', $surveys);
});