const keystone						= require( 'keystone' ),
	  robots						= require( 'express-robots' ),
	  setupMiddleware				= require( './utils/setup.middleware' ),
	  notificationMiddleware		= require( './utils/notification.middleware' ),
	  childService					= require( './components/children/child.controllers' ),
	  childMiddleware				= require( './components/children/child.middleware' ),
	  donationService				= require( './components/donations/donation.controllers' ),
	  eventService					= require( './components/events/event.controllers' ),
	  familyService					= require( './components/families/family.controllers' ),
	  questionMiddleware			= require( './components/questions/have-a-question.middleware' ),
	  inquiryMiddleware				= require( './components/inquiries/inquiry.middleware' ),
	  accountMiddleware				= require( './components/accounts/account.middleware' ),
	  userService					= require( './components/users/user.middleware' ),
	  registrationMiddleware		= require( './components/accounts/account.controllers' ),
	  userMiddleware				= require( './components/users/user.middleware' ),
	  eventMiddleware				= require( './components/events/event.middleware' ),
	  passwordResetService 			= require( './components/accounts/account.password-reset.controllers'),
	  accountVerificationService	= require( './components/account verification codes/account-verification-code.middleware' ),
	  toolsService					= require( './components/reporting dashboard/tools.controllers' ),
	  mailchimpService				= require( './components/mailchimp lists/mailchimp-list.controllers' ),
	  enforce						= require( 'express-sslify' ),
	  importRoutes					= keystone.importer( __dirname );

// common middleware
keystone.pre( 'routes', setupMiddleware.initLocals );
keystone.pre( 'render', notificationMiddleware.flashMessages );

// import route controllers
var routes = {
	views: importRoutes( './views' )
};

// setup route bindings
// TODO: in order to handle bad routes, we need a catch here instead of on the client side
// TODO: clean up these routes to call middleware ( where views aren't appropriate ) which then calls services, instead of services directly
exports = module.exports = app => {
	'use strict';

	// set up forwarding to HTTPS at the app level when http is explicitly used
	// use enforce.HTTPS({ trustProtoHeader: true }) in case you are behind a load balancer (e.g. Heroku)
	if( keystone.get( 'env' ) === 'production' ) {
		app.use( enforce.HTTPS( { trustProtoHeader: true } ) );
	}

	// serve robots.txt based on the runtime environment
	if ( process.env.ALLOW_ROBOTS === 'true' ) {
		// if running in production, allow robots to crawl by serving the production robots.txt
		app.use( robots( `${ __dirname }/config/robots/robots-production.txt` ) );
	} else {
		// otherwise, serve the dev robots.txt ( i.e. disallow all crawlers )
		app.use( robots( `${ __dirname }/config/robots/robots-development.txt` ) );
	}

	// home page
	app.get( '/'										, routes.views.main );
	// MARE staff generated pages
	app.get( '/page/:key'								, routes.views.page );
	/* TODO: combine all these requests into /forms/:key and handle the service calls in middleware */
	// forms
	app.get( '/forms/agency-event-submission'			, routes.views.form_agencyEventSubmission );
	app.post( '/forms/agency-event-submission'			, eventService.submitEvent );

	app.get( '/forms/social-worker-child-registration'	, accountMiddleware.requireUser( 'social worker' ), childMiddleware.getChildrenByRecruitmentWorker, routes.views.form_childRegistration );
	app.post( '/forms/social-worker-child-registration'	, accountMiddleware.requireUser( 'social worker' ), childService.registerChild );

	app.get( '/forms/social-worker-family-registration'	, accountMiddleware.requireUser( 'social worker' ), routes.views.form_familyRegistration );
	app.post( '/forms/social-worker-family-registration', accountMiddleware.requireUser( 'social worker' ), familyService.registerFamily );

	app.get( '/forms/information-request'				, routes.views.form_informationRequest );
	app.post( '/forms/information-request'				, inquiryMiddleware.submitInquiry );

	app.get( '/forms/have-a-question'					, routes.views.form_haveAQuestion );
	app.post( '/forms/have-a-question'					, questionMiddleware.submitQuestion );
	// steps in the process
	app.get( '/steps-in-the-process'					, routes.views.stepsInTheProcess );
	// events
	app.get( '/events/export/:eventId'					, eventMiddleware.exportToExcel );
	app.get( '/events/:category'						, routes.views.events );
	app.get( '/events/:category/:key'					, routes.views.event );
	app.post( '/events/get/social-worker-data'			, eventMiddleware.getActiveSocialWorkers );
	app.post( '/events/register/:eventId'				, eventMiddleware.register );
	app.post( '/events/unregister/:eventId'				, eventMiddleware.unregister );
	app.post( '/events/edit-registration/:eventId'		, eventMiddleware.editRegistration );
	app.put( '/events/:id/attendees'					, eventMiddleware.updateEventAttendees );
	// success stories
	app.get( '/success-stories'							, routes.views.successStories );
	app.get( '/success-stories/:key'					, routes.views.successStory );
	// gallery
	app.get( '/waiting-child-profiles'					, routes.views.waitingChildProfiles );
	// registration
	app.get( '/register'								, routes.views.register );
	app.post( '/register'								, registrationMiddleware.registerUser, accountMiddleware.loginAjax );
	// login / logout
	app.get( '/logout'									, accountMiddleware.logout );
	app.post('/login'									, accountMiddleware.login );
	// TODO: refactor these routes and their processing
	//login forgot password
	app.post('/recover/generate'						, passwordResetService.resetPassword );
	app.post('/recover'									, passwordResetService.changePassword );
	app.get( '/recover'									, passwordResetService.getForm ); // the view should be rendered in this chain
	// MARE in the news
	app.get( '/mare-in-the-news'						, routes.views.mareInTheNewsStories );
	app.get( '/mare-in-the-news/:key'					, routes.views.mareInTheNewsStory );
	// donations
	app.get( '/donate'									, routes.views.donate );
	app.post( '/donate'									, donationService.validateDonationRequest, donationService.processDonation );
	// user account management
	app.get( '/account'									, accountMiddleware.requireUser(), routes.views.account );
	app.put( '/account/user-info'						, userMiddleware.updateUser );
	app.put( '/account/user-email-lists'				, userMiddleware.updateUserEmailLists );
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
	app.post( '/services/get-gallery-permissions'		, userService.getGalleryPermissions );
	
	// reporting tools
	app.get( '/dashboard'											, routes.views.dashboard );
	app.get( '/tools/child-matching'								, routes.views.toolsChildMatching );
	app.get( '/tools/family-matching'								, routes.views.toolsFamilyMatching );
	app.get( '/tools/services/get-agencies-data'					, toolsService.getAgenciesData );
	app.get( '/tools/services/get-social-workers-data'				, toolsService.getSocialWorkersData );
	app.get( '/tools/services/get-families-data'					, toolsService.getFamiliesData );
	app.get( '/tools/services/get-children-data'					, toolsService.getChildrenData );
	app.post( '/tools/services/save-children-matching-history'		, toolsService.saveChildrenMatchingHistory );
	app.post( '/tools/services/save-families-matching-history'		, toolsService.saveFamiliesMatchingHistory );

	// webhooks
	app.get( '/webhooks/mailchimp'                      , mailchimpService.validateWebhookURL );
	app.post( '/webhooks/mailchimp'                     , mailchimpService.processWebhookUpdates );
};
