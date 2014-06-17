@extends('layout')

@section('content')
    @foreach($surveys as $survey)
        <p>{{ $survey->email }}</p>
    @endforeach