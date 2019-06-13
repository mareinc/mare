const keystone				= require( 'keystone' ),
	  _						= require( 'underscore' ),
	  moment				= require( 'moment' ),
	  dashboardService		= require( '../../components/reporting dashboard/dashboard.controllers' );

exports = module.exports = ( req, res ) => {
	'use strict';

	const view		= new keystone.View( req, res ),
		  locals	= res.locals,
		  userType	= req.user ? req.user.userType : '',
		  daysRange = 30;
	
	// access to admins only
	if ( userType.length === 0 || userType !== 'admin' ) {
		res.statusCode = 403;
		res.setHeader( 'Content-Type', 'text/plain' );
		res.end( 'Access denied' );
		return;
	}
	
	let fromDate = typeof req.query.fromDate !== 'undefined' ? req.query.fromDate : moment().subtract(daysRange, "days").format( 'YYYY-MM-DD' );
	let toDate = typeof req.query.toDate !== 'undefined' ? req.query.toDate : moment().format( 'YYYY-MM-DD' );
	let ytdFromDate = ( moment().month() >= 7 ? moment().year() : moment().year() - 1 ) + '-07-01';
	
	locals.fromDate = fromDate;
	locals.toDate = toDate;
	
	let getNumberOfFamilies = dashboardService.getNumberOfModels( 'Family', fromDate, toDate, 'createdAt' ),
		getNumberOfChildren = dashboardService.getNumberOfModels( 'Child', fromDate, toDate, 'createdAt' ),
		getNumberOfInquiries = dashboardService.getNumberOfModels( 'Inquiry', fromDate, toDate, 'takenOn' ),
		getNumberOfPlacements = dashboardService.getNumberOfModels( 'Placement', ytdFromDate, toDate, 'placementDate' ),
		getNumberOfActiveChildren = dashboardService.getNumberOfChildrenByStatusNameAndRegionID( 'active', undefined ),
		getNumberOfOnHoldChildren = dashboardService.getNumberOfChildrenByStatusNameAndRegionID( 'on hold', undefined ),
		getNumberOfAllChildren = dashboardService.getNumberOfChildrenByRegionID( undefined ),
		getChildrenNumbersGroupedByRegions = dashboardService.getChildrenNumbersGroupedByRegions( );
	
	Promise.all( [ getNumberOfFamilies, getNumberOfChildren, getNumberOfInquiries, getNumberOfPlacements, getNumberOfActiveChildren, getNumberOfOnHoldChildren, getNumberOfAllChildren, getChildrenNumbersGroupedByRegions ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ numberOfFamilies, numberOfChildren, numberOfInquiries, numberOfPlacements, numberOfActiveChildren, numberOfOnHoldChildren, numberOfAllChildren, childrenNumbersGroupedByRegions ] = values;
			
			// assign properties to locals for access during templating
			locals.numberOfFamilies = numberOfFamilies;
			locals.numberOfChildren = numberOfChildren;
			locals.numberOfInquiries = numberOfInquiries;
			locals.numberOfPlacements = numberOfPlacements;
			locals.numberOfActiveChildren = numberOfActiveChildren;
			locals.numberOfOnHoldChildren = numberOfOnHoldChildren;
			locals.numberOfActiveAndOnHoldChildren = numberOfActiveChildren + numberOfOnHoldChildren;
			locals.numberOfAllChildren = numberOfAllChildren;
			locals.childrenNumbersGroupedByRegions = childrenNumbersGroupedByRegions;
			
			
			view.render( 'dashboard', { layout: 'dashboard' } );
		})
		.catch( err => {
			// log an error for debugging purposes
			console.error( `error loading data for the dashboard - ${ err }` );
			
			view.render( 'dashboard', { layout: 'dashboard' } );
		});
};
