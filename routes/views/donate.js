const keystone						= require( 'keystone' ),
	  pageService					= require( '../middleware/service_page' ),
	  donationService				= require( '../middleware/service_donation' ),
	  emailTargetMiddleware			= require( '../middleware/service_email-target' ),
	  staffEmailContactMiddleware	= require( '../middleware/service_staff-email-contact' );

// TODO: add code for a logged in user showing their previous donations/donation dates
exports = module.exports = ( req, res ) => {
    'use strict';

    const view 		= new keystone.View( req, res ),
		  locals 	= res.locals;
	// set default information for a staff email contact in case the real contact info can't be fetched
	locals.donationsQuestionContact = {
		name: { full: 'MARE' },
		email: 'info@mareinc.org'
	};

	// set donation interval data and the stripe API key
	locals.donationPlans	= donationService.PLAN_TYPES;
	locals.stripeAPIKey		= process.env.STRIPE_PUBLIC_API_KEY;

	Promise.resolve()
		// fetch the email target model matching 'donation question'
		.then( () => emailTargetMiddleware.getEmailTargetByName( 'donation question' ) )
		// fetch contact info for the staff contact for 'donation question'
		.then( emailTarget => staffEmailContactMiddleware.getStaffEmailContactByEmailTarget( emailTarget.get( '_id' ), [ 'staffEmailContact' ] ) )
		// overwrite the default contact details with the returned object
		.then( staffEmailContact => locals.donationsQuestionContact = staffEmailContact.staffEmailContact )
		// log any errors fetching the staff email contact
		.catch( err => console.error( `error fetching email target for donation questions, default contact info will be used instead - ${ err }` ) )
		// fetch the sidebar items
		.then( () => pageService.getSidebarItems() )
		// if the sidebar items were fetched successfully
		.then( sidebarItems => {
			// the sidebar items are a success story and event in an array, assign local variables to the two objects
			const [ randomSuccessStory, randomEvent ] = sidebarItems;
			// assign properties to locals for access during templating
			locals.randomSuccessStory	= randomSuccessStory;
			locals.randomEvent			= randomEvent;		
			
			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the donate.hbs template
			view.render( 'donate' );
		})
		// if there was an error fetching the sidebar items
		.catch( err => {
			// log an error for debugging purposes
			console.error( `error loading sidebar data for the donation page - ${ err }` );
			// render the view using the donate.hbs template
			view.render( 'donate' );
		});
};
