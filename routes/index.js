const keystone						= require( 'keystone' ),
	  childService					= require( './middleware/service_child' ),
	  donationService				= require( './middleware/service_donation')
	  eventService					= require( './middleware/service_event' ),
	  familyService					= require( './middleware/service_family' ),
	  formService					= require( './middleware/service_form' ),
	  middleware					= require( './middleware/middleware' ),
	  permissionsService			= require( './middleware/service_permissions' ),
	  registrationMiddleware		= require( './middleware/service_register' ),
	  accountMiddleware				= require( './middleware/service_account' ),
	  eventMiddleware				= require( './middleware/middleware_event' ),
	  passwordResetService 			= require( './middleware/service_password-reset'),
	  accountVerificationService	= require( './middleware/service_account-verification' );
	  importRoutes					= keystone.importer( __dirname );

// common middleware
keystone.pre( 'routes', middleware.initLocals );
keystone.pre( 'render', middleware.flashMessages );

// import route controllers
var routes = {
	views: importRoutes( './views' )
};

// setup route bindings
// TODO: in order to handle bad routes, we need a catch here instead of on the client side
// TODO: clean up these routes to call middleware ( where views aren't appropriate ) which then calls services, instead of services directly
exports = module.exports = app => {
	'use strict';

	// home page
	app.get( '/'										, routes.views.main );
	// MARE staff generated pages
	app.get( '/page/:key'								, routes.views.page );
	/* TODO: combine all these into /forms/:key and handle the service calls in middleware */
	// forms
	app.get( '/forms/agency-event-submission-form'		, routes.views.form_agencyEventSubmission );
	app.get( '/forms/child-registration-form'			, routes.views.form_childRegistration );
	app.get( '/forms/family-registration-form'			, routes.views.form_familyRegistration );
	app.get( '/forms/information-request-form'			, routes.views.form_informationRequest );
	app.get( '/forms/have-a-question-form'				, routes.views.form_haveAQuestion );
	// steps in the process
	app.get( '/steps-in-the-process'					, routes.views.stepsInTheProcess );
	// events
	app.get( '/events/:category'						, routes.views.events );
	app.get( '/events/:category/:key'					, routes.views.event );
	app.post( '/events/register/:eventId'				, eventMiddleware.register );
	app.post( '/events/unregister/:eventId'				, eventMiddleware.unregister );
	// success stories
	app.get( '/success-stories'							, routes.views.successStories );
	app.get( '/success-stories/:key'					, routes.views.successStory );
	// gallery
	app.get( '/waiting-child-profiles'					, routes.views.waitingChildProfiles );
	// registration
	app.get( '/register'								, routes.views.register );
	app.post( '/register'								, registrationMiddleware.registerUser, middleware.loginAjax );
	// login / logout
	app.get( '/logout'									, middleware.logout );
	app.post('/login'									, middleware.login );
	//login forgot password
	app.post('/recover/generate'						, passwordResetService.resetPassword );
	app.post('/recover'									, passwordResetService.changePassword );
	app.get( '/recover'									, passwordResetService.getForm ); // the view should be rendered in this chain
	// MARE in the news
	app.get( '/mare-in-the-news'						, routes.views.mareInTheNewsStories );
	app.get( '/mare-in-the-news/:key'					, routes.views.mareInTheNewsStory );
	// donations
	app.get( '/donate'									, routes.views.donate );

	app.post( '/process-donation'						, donationService.validateDonationRequest, donationService.processDonation );
	// custom route used exclusively for the data migration
	app.get('/migrate-data/'							, middleware.requireMigrationUser, routes.views.dataMigration );
	// user account management
	app.get( '/account'									, middleware.requireUser, routes.views.account );
	app.put( '/account/user-info'						, accountMiddleware.updateUser );
	// verification code handling after user registers
	app.get('/verifyAccount'							, accountVerificationService );
	/* TODO: all these routes below need to be moved and prefixed with appropriate REST verbs like put */
	// services for ajax calls
	app.post( '/services/get-children-data'				, childService.getGalleryData );
	app.post( '/services/get-child-details'				, childService.getChildDetails );
	app.post( '/services/get-sibling-group-details'		, childService.getSiblingGroupDetails );
	app.post( '/services/add-child-bookmark'			, familyService.addChildBookmark );
	app.post( '/services/remove-child-bookmark'			, familyService.removeChildBookmark );
	app.post( '/services/add-sibling-group-bookmark'	, familyService.addSiblingGroupBookmark );
	app.post( '/services/remove-sibling-group-bookmark'	, familyService.removeSiblingGroupBookmark );
	app.post( '/services/get-gallery-permissions'		, permissionsService.getGalleryPermissions );
	// app.post( '/services/register-for-event'			, eventService.addUser ); // TODO: I'm leaving these commented out so I don't forget they exist when I need to implement adding/removing users to an event automatically
	// app.post( '/services/unregister-for-event'			, eventService.removeUser ); // TODO: I'm leaving these commented out so I don't forget they exist when I need to implement adding/removing users to an event automatically
	// services for form submissions
	app.post( '/submit-agency-event'					, eventService.submitEvent );
	app.post( '/submit-question'						, formService.submitQuestion );
	app.post( '/submit-information-request'				, formService.submitInquiry );
	app.post( '/social-worker-register-child'			, childService.registerChild );
	app.post( '/social-worker-register-family'			, familyService.registerFamily );
};
