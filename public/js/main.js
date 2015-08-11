$(document).ready(function() {
 
	$("#owl-demo").owlCarousel({
		singleItem : true,
		lazyLoad : true,
		lazyEffect: 'fade',
		autoPlay : true,
		slideSpeed : 300,
		transitionStyle : 'fade'
	});

	$( "#owl-demo img" ).load(function() {
		$(this).siblings('.featured-description').removeClass('hidden');
	});
 
});