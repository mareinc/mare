$(document).ready(function() {

  // Bind adding of 'hover' class to tap vs hover depending on whether it is a touch enabled device
  if (Modernizr.touch) {
    $(".nav li").unbind('mouseenter mouseleave');
    $(".nav li a.parent").unbind('click');
    $(".nav li .more").unbind('click').bind('click', function() {     
      $(this).parent("li").toggleClass("hover");
    });

  } else {
    $(".nav li").removeClass("hover");
    $(".nav li a").unbind('click');
    $(".nav li").unbind('mouseenter mouseleave').bind('mouseenter mouseleave', function() {
      // must be attached to li so that mouseleave is not triggered when hovering over a submenu
      $(this).toggleClass('hover');
    });
  }
 
 	// initialize the carousel on the home page
	$("#owl-demo").owlCarousel({
		singleItem : true,
		lazyLoad : true,
		lazyEffect: 'fade',
		autoPlay : true,
		slideSpeed : 300,
		transitionStyle : 'fade'
	});

	// prevents the carousel image descriptions from loading in before the images do
	$( "#owl-demo img" ).load(function() {
		$(this).siblings('.featured-description').removeClass('hidden');
	});

  // initialize the mobile menu attached to the hamburger icon
	$("#mobile-menu").mmenu({
       "extensions": [
          "border-full",
          "effect-slide-menu",
          "effect-slide-panels-0",
          "pageshadow",
          "theme-dark"
       ],
       "offCanvas": {
          "position": "right"
       },
       "counters": true,
       "navbars": [
          {
             "position": "top",
             "content": [
                "prev",
                "title",
                "close"
             ]
          },
          {
             "position": "bottom",
             "content": [
                "<a class='fa fa-envelope' href='#/'></a>",
                "<a class='fa fa-twitter' href='#/'></a>",
                "<a class='fa fa-facebook' href='#/'></a>"
             ]
          }
       ]
    });


	// allows the mobile menu to be seen (it was hidden to prevent it flashing on the screen during page load)
	$('#mobile-menu').removeClass('hidden');

});