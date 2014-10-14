$(document).ready( function() {
    $('#navigation #select li').addClass("hidden");
    $('#navigation #select li.hidden').removeClass("hidden");

    $('#navigation #select').mouseover(function () {
        $('#navigation #select li').removeClass("hidden");
    });

    $('#navigation #select').mouseout(function () {
        $('#navigation #select li').addClass("hidden");
        $('#navigation #select li.active.hidden').removeClass("hidden");
    });
});