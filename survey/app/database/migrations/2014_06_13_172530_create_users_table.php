<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateUsersTable extends Migration {

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */


	public function up()
	{
	    Schema::create('surveys', function($table)
	    {
	        $table->increments('id');
	        $table->string('email')->unique();
	        $table->string('age');
	        $table->timestamps();
	    });
	}


	public function down()
	{
	    Schema::drop('surveys');
	}

}
