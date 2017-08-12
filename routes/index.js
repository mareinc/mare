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

const keystone					= require( 'keystone' ),
	  childService				= require( './middleware/service_child' ),
	  eventService				= require( './middleware/service_event' ),
	  familyService				= require( './middleware/service_family' ),
	  formService				= require( './middleware/service_form' ),
	  middleware				= require( './middleware/middleware' ),
	  permissionsService		= require( './middleware/service_permissions' ),
	  registrationMiddleware	= require( './middleware/service_register' ),
	  importRoutes				= keystone.importer( __dirname );

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
// TODO: clean up these routes to use cleaner paths and route parameters instead of just wildcards
exports = module.exports = app => {
	'use strict';

	// home page
	app.get( '/'										, routes.views.main );
	// MARE staff generated pages
	app.get( '/page/*'									, routes.views.page );
	// forms
	app.get( '/forms/agency-event-submission-form'		, routes.views.form_agencyEventSubmission );
	app.get( '/forms/child-registration-form'			, routes.views.form_childRegistration );
	app.get( '/forms/family-registration-form'			, routes.views.form_familyRegistration );
	app.get( '/forms/information-request-form'			, routes.views.form_informationRequest );
	app.get( '/forms/have-a-question-form'				, routes.views.form_haveAQuestion );
	// steps in the process
	app.get( '/steps-in-the-process'					, routes.views.stepsInTheProcess );
	// events
	app.get( eventListRoutes							, routes.views.eventList );
	app.get( eventRoutes								, routes.views.event );
	// success stories
	app.get( '/success-stories/'						, routes.views.successStories );
	app.get( '/success-stories/*'						, routes.views.successStory );
	// gallery
	app.get( '/waiting-child-profiles/'					, routes.views.waitingChildProfiles );
	// registration
	app.get( '/register/'								, routes.views.register );
	app.post( '/register'								, registrationMiddleware.registerUser );
	// login / logout
	app.get( '/logout/'									, middleware.logout );
	app.post('/login'									, middleware.login );
	// TODO: decide if both the mare in the news routes are needed
	// MARE in the news
	app.get( '/mare-in-the-news/'						, routes.views.mareInTheNews );
	app.get( '/mare-in-the-news/*'						, routes.views.mareInTheNews );
	// donations
	app.get( '/donate/'									, routes.views.donate );
	app.post( '/charge'									, middleware.charge );
	// user account management
	app.get( '/account/'								, middleware.requireUser, routes.views.account );
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
	app.post( '/submit-question'						, formService.submitQuestion );
	app.post( '/submit-information-request'				, formService.submitInformationRequest );
	app.post( '/social-worker-register-child'			, childService.registerChild );
	app.post( '/social-worker-register-family'			, familyService.registerFamily );
};
