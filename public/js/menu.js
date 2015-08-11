var ww = document.body.clientWidth;

$(document).ready(function() {
	// $(".nav li a").each(function() {
	// 	if ($(this).next().length > 0) {
	// 		$(this).addClass("parent");
	// 	};
	// })
	
	$(".toggleMenu").click(function(e) {
		e.preventDefault();
		$(this).toggleClass("active");
		$(".nav").toggle();
	});
	adjustMenu();
})

$(window).bind('resize orientationchange', function() {
	ww = document.body.clientWidth;
	adjustMenu();
});

var adjustMenu = function() {
	if (ww < 768) {
	// if "more" link not in DOM, add it
	if (!$(".more")[0]) {
	$('<div class="more">&nbsp;</div>').insertBefore($('.parent')); 
	}
		$(".toggleMenu").css("display", "inline-block");
		if (!$(".toggleMenu").hasClass("active")) {
			$(".nav").hide();
		} else {
			$(".nav").show();
		}
		$(".nav li").unbind('mouseenter mouseleave');
		$(".nav li a.parent").unbind('click');
	$(".nav li .more").unbind('click').bind('click', function() {
			
			$(this).parent("li").toggleClass("hover");
		});
	} 
	else if (ww >= 768) {
	// remove .more link in desktop view
	$('.more').remove(); 
		$(".toggleMenu").css("display", "none");
		$(".nav").show();
		$(".nav li").removeClass("hover");
		$(".nav li a").unbind('click');
		$(".nav li").unbind('mouseenter mouseleave').bind('mouseenter mouseleave', function() {
			// must be attached to li so that mouseleave is not triggered when hover over submenu
			$(this).toggleClass('hover');
		});
	}
}