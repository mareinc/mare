$(function() {
	'use strict';
	// Extract useful url information and store it on the mare namespace
	mare.utils.storeUrlInfo();
	// Ensure touch events are handled appropriately
	mare.utils.bindTouch();
	// Every route needs to initialize views for scaffolded areas like the header and the navigation
	mare.views.siteMenu = mare.views.siteMenu || new mare.views.SiteMenu();
	mare.views.mobileMenu = mare.views.mobileMenu || new mare.views.MobileMenu();
	// Handle basic routing, initializing based on the result
	// No default exists due to main routing being handled by the server

	// start the backbone history state for browser navigation through backbone routes
	Backbone.history.start();

	switch(mare.url.siteArea) {
		case ''							: mare.routers.home = new mare.routers.Home();									break;
		case 'donate'                   : mare.routers.donations = new mare.routers.Donations();						break;
		case 'events'                   : mare.routers.events = new mare.routers.Events();								break;
		case 'form'						: mare.routers.forms = new mare.routers.Forms();								break;
		case 'page'                     : mare.routers.pages = new mare.routers.Pages();								break;
		case 'preferences'              : mare.routers.preferences = new mare.routers.Preferences();					break;
		case 'register'                 : mare.routers.registration = new mare.routers.Registration();					break;
		case 'success-stories'          : mare.routers.successStories = new mare.routers.SuccessStories();				break;
		case 'waiting-child-profiles'	: mare.routers.waitingChildProfiles = new mare.routers.WaitingChildProfiles();
	}
	// private function used to handle malformed routes to send a user back to the home page
	// TODO: See if this is used anywhere
	function goHome() {
		window.location.href = "/";
	}
});