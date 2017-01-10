/**
 * This file is where you define your application routes and controllers.
 *
 * Start by including the middleware you want to run for every request;
 * you can attach middleware to the pre('routes') and pre('render') events.
 *
 * For simplicity, the default setup for route controllers is for each to be
 * in its own file, and we import all the files in the /routes/views directory.
 *
 * Each of these files is a route controller, and is responsible for all the
 * processing that needs to happen for the route (e.g. loading data, handling
 * form submissions, rendering the view template, etc).
 *
 * Bind each route pattern your application should respond to in the function
 * that is exported from this module, following the examples below.
 *
 * See the Express application routing documentation for more information:
 * http://expressjs.com/api.html#app.VERB
 */

const keystone					= require( 'keystone' );
const middleware				= require( './middleware/middleware' );
const registrationMiddleware	= require( './middleware/service_register' );
const childService				= require( './middleware/service_child' );
const eventService				= require( './middleware/service_event' );
const familyService				= require( './middleware/service_family' );
const formService				= require( './middleware/service_form' );
const permissionsService		= require( './middleware/service_permissions' );
const importRoutes				= keystone.importer( __dirname );

// Common Middleware
keystone.pre( 'routes', middleware.initLocals );
keystone.pre( 'render', middleware.flashMessages );

// Import Route Controllers
var routes = {
	views: importRoutes( './views' )
};

/* TODO: try to find a less verbose way to handle these event routes */
// Create arrays of routes for complicated sub-routing
const eventListRoutes	= [ '/events/adoption-parties/', '/events/mapp-trainings/', '/events/fundraising-events/', '/events/agency-info-meetings/', '/events/other-trainings/' ];
const eventRoutes		= [ '/events/adoption-parties/*', '/events/mapp-trainings/*', '/events/fundraising-events/*', '/events/agency-info-meetings/*', '/events/other-trainings/*' ];

// Setup Route Bindings
// TODO: in order to handle bad rountes, we need a catch here instead of on the client side
exports = module.exports = app => {
	'use strict';

	// home page
	app.get( '/'										, middleware.setLoginTarget, routes.views.main );
	// MARE staff generated pages
	app.get( '/page/*'									, middleware.setLoginTarget, routes.views.page );
	// forms
	app.get( '/forms/agency-event-submission-form'		, middleware.setLoginTarget, routes.views.form_agencyEventSubmission );
	app.get( '/forms/car-donation-form'					, middleware.setLoginTarget, routes.views.form_carDonation );
	app.get( '/forms/child-registration-form'			, middleware.setLoginTarget, routes.views.form_childRegistration );
	app.get( '/forms/information-request-form'			, middleware.setLoginTarget, routes.views.form_informationRequest );
	app.get( '/forms/have-a-question-form'				, middleware.setLoginTarget, routes.views.form_haveAQuestion );
	// events
	app.get( '/events/'									, middleware.setLoginTarget, routes.views.eventCategories );
	app.get( eventListRoutes							, middleware.setLoginTarget, routes.views.eventList );
	app.get( eventRoutes								, middleware.setLoginTarget, routes.views.event );
	// success stories
	app.get( '/success-stories/'						, middleware.setLoginTarget, routes.views.successStories );
	app.get( '/success-stories/*'						, middleware.setLoginTarget, routes.views.successStory );
	// gallery
	app.get( '/waiting-child-profiles/'					, middleware.setLoginTarget, routes.views.waitingChildProfiles );
	// registration
	app.get( '/register/'								, middleware.setLoginTarget, routes.views.register );
	app.post( '/register'								, registrationMiddleware.registerUser );
	// app.get( '/verify-registration'						, routes.views.verifyRegistration );
	// login / logout
	app.get( '/logout/'									, middleware.logout );
	app.post('/login'									, middleware.login );
	// donations
	app.get( '/donate/'									, middleware.setLoginTarget, routes.views.donate );
	app.post( '/charge'									, middleware.charge );
	// user management / preferences
	app.get( '/preferences/'							, middleware.requireUser, routes.views.preferences );
	// services for ajax calls
	app.post( '/services/get-children-data'				, childService.getGalleryData );
	app.post( '/services/get-child-details'				, childService.getChildDetails );
	app.post( '/services/get-sibling-group-details'		, childService.getSiblingGroupDetails );
	app.post( '/services/add-child-bookmark'			, familyService.addChildBookmark );
	app.post( '/services/remove-child-bookmark'			, familyService.removeChildBookmark );
	app.post( '/services/add-sibling-group-bookmark'	, familyService.addSiblingGroupBookmark );
	app.post( '/services/remove-sibling-group-bookmark'	, familyService.removeSiblingGroupBookmark );
	app.post( '/services/get-gallery-permissions'		, permissionsService.getGalleryPermissions );
	app.post( '/services/register-for-event'			, eventService.addUser );
	app.post( '/services/unregister-for-event'			, eventService.removeUser );
	// services for form submissions
	app.post( '/submit-agency-event'					, eventService.submitEvent );
	app.post( '/submit-car-donation'					, formService.submitCarDonation );
	app.post( '/submit-question'						, formService.submitQuestion );

	// NOTE: To protect a route so that only admins can see it, use the requireUser middleware:
	// app.get('/protected', middleware.requireUser, routes.views.protected);
};
