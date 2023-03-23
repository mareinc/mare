const keystone						= require( 'keystone' ),
	  robots						= require( 'express-robots' ),
	  setupMiddleware				= require( './utils/setup.middleware' ),
	  notificationMiddleware		= require( './utils/notification.middleware' ),
	  globalAlertMiddleware			= require( './components/global alert/global-alert.middleware' ),
	  childService					= require( './components/children/child.controllers' ),
	  childMiddleware				= require( './components/children/child.middleware' ),
	  profileSearchService			= require( './components/profile searches/profile.search.controllers' ),
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
	  mailingListMiddleware			= require( './components/mailchimp lists/mailchimp-list-middleware' ),
	  enforce						= require( 'express-sslify' ),
	  importRoutes					= keystone.importer( __dirname );

// common middleware
keystone.pre( 'routes', setupMiddleware.initLocals, setupMiddleware.initErrorHandlers );
keystone.pre( 'render', notificationMiddleware.flashMessages, globalAlertMiddleware.globalAlert );

// handle non-existent routes
keystone.set( '404', function( req, res, next ) {

	// log the path the generated the 404
	console.log( `unhandled route (404) encountered with path: ${req.path}` );
    
	// pass execution to the notFound middleware, which will set status code to 404 and display the 404 page
	res.notFound();
});
 
// handle generic server errors (some routes/services already have error handling, this should not take precedence)
keystone.set( '500', function( err, req, res, next ) {

	// log the path that generated the 500 error
	console.log( `500 error generated for request with path: ${req.path}` );
	// if a request body exists, log it out as well
	if ( req.body && Object.keys( req.body ).length > 0 ) {
		console.log( 'request body:' );
		console.log( req.body );
	}
	// log the error itself
	console.error( err );

	// pass execution to the notFound middleware, which will set the status code to 500 and display the 500 page
	res.err();
});

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
	app.post( '/forms/social-worker-child-edit'			, accountMiddleware.requireUser( 'social worker'), childService.editChildRegistration );

	app.get( '/forms/social-worker-family-registration'	, accountMiddleware.requireUser( 'social worker' ), routes.views.form_familyRegistration );
	app.post( '/forms/social-worker-family-registration', accountMiddleware.requireUser( 'social worker' ), familyService.registerHomestudy );

	app.get( '/forms/information-request'				, inquiryMiddleware.requireInStateFamily, routes.views.form_informationRequest );
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
	app.get( '/adoption-stories'						, routes.views.successStories );
	app.get( '/adoption-stories/:key'					, routes.views.successStory );
	// gallery
	app.get( '/waiting-child-profiles'					, routes.views.waitingChildProfiles );
	// registration
	app.get( '/register'								, routes.views.register );
	app.post( '/register'								, registrationMiddleware.registerUser );
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
    app.put( '/account/inquiry-note'                    , inquiryMiddleware.saveInquiryNote );
	// verification code handling after user registers
	app.get( '/verify'									, routes.views.form_accountVerify );
	app.post( '/account/verify'							, accountVerificationService );
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
	app.post( '/services/update-mailing-lists'			, mailingListMiddleware.updateMailingListPreferences );
	app.post( '/services/mailing-list-unsubscribe'		, mailingListMiddleware.unsubscribeUserFromMailingList );
	app.post( '/services/save-profile-search'			, profileSearchService.saveProfileSearch );
	
	// reporting tools
	app.get( '/tools'											, accountMiddleware.requireUser( 'admin' ), routes.views.tools );
	app.get( '/tools/services/get-agencies-data'				, accountMiddleware.requireUser( 'admin' ), toolsService.getAgenciesData );
	app.get( '/tools/services/get-social-workers-data'			, accountMiddleware.requireUser( 'admin' ), toolsService.getSocialWorkersData );
	app.get( '/tools/services/get-cities-or-towns-data'			, accountMiddleware.requireUser( 'admin' ), toolsService.getCitiesAndTownsData );
	app.get( '/tools/services/get-families-data'				, accountMiddleware.requireUser( 'admin' ), toolsService.getFamiliesData );
	app.get( '/tools/services/get-children-data'				, accountMiddleware.requireUser( 'admin' ), toolsService.getChildrenData );
	app.get( '/tools/services/get-sources-data'					, accountMiddleware.requireUser( 'admin' ), toolsService.getSourcesData );
	app.post( '/tools/services/save-children-matching-history'	, accountMiddleware.requireUser( 'admin' ), toolsService.saveChildrenMatchingHistory );
	app.post( '/tools/services/save-families-matching-history'	, accountMiddleware.requireUser( 'admin' ), toolsService.saveFamiliesMatchingHistory );
	app.get( '/tools/services/get-dashboard-data'				, accountMiddleware.requireUser( 'admin' ), toolsService.getDashboardData );
	app.get( '/tools/services/get-child-matching-data'			, accountMiddleware.requireUser( 'admin' ), toolsService.getChildMatchingData );
	app.get( '/tools/services/get-family-matching-data'			, accountMiddleware.requireUser( 'admin' ), toolsService.getFamilyMatchingData );
	app.get( '/tools/services/get-inquiry-data'					, accountMiddleware.requireUser( 'admin' ), toolsService.getInquiryData );
	app.get( '/tools/services/get-placement-data'				, accountMiddleware.requireUser( 'admin' ), toolsService.getPlacementData );
	app.get( '/tools/services/get-media-features-data'			, accountMiddleware.requireUser( 'admin' ), toolsService.getMediaFeaturesData );
	app.get( '/tools/services/get-child-listing-data'			, accountMiddleware.requireUser( 'admin' ), toolsService.getChildListingData );
	app.get( '/tools/services/get-family-listing-data'			, accountMiddleware.requireUser( 'admin' ), toolsService.getFamilyListingData );
	app.get( '/tools/services/get-family-stages-data'			, accountMiddleware.requireUser( 'admin' ), toolsService.getFamilyStagesData );
    app.get( '/tools/services/get-caseload-data'			    , accountMiddleware.requireUser( 'admin' ), toolsService.getChildCaseloadData );
	app.get( '/tools/services/get-family-activity-data'			, accountMiddleware.requireUser( 'admin' ), toolsService.getFamilyActivityData );

	// webhooks
	app.post( '/webhooks/process-child-inquiry', function( req, res, next ) {
		console.log( 'Processing child inquiry webhook...' );
		console.log( req.body );
		res.send( 200 );
	});
};
