const keystone					= require( 'keystone' ),
	  listsService				= require( '../../components/lists/list.controllers' ),
	  pageService				= require( '../../components/pages/page.controllers' ),
	  mailingListService		= require( '../../components/mailing lists/mailing-list.controllers' );

exports = module.exports = ( req, res ) => {
	'use strict';

	const view 		= new keystone.View( req, res ),
		  locals 	= res.locals;

	// objects with additional search parameters
	const raceOptions		= { other: true },
		  stateOptions		= { default: 'Massachusetts' },
		  waysToHearOptions	= { other: true };

	// fetch all data needed to render this page
	let fetchChildTypes				= listsService.getChildTypesForWebsite(),
		fetchCitiesAndTowns			= listsService.getAllCitiesAndTowns(),
		fetchGenders				= listsService.getAllGenders(),
		fetchLanguages				= listsService.getAllLanguages(),
		fetchLegalStatuses			= listsService.getAllLegalStatuses(),
		fetchRaces					= listsService.getAllRaces( raceOptions ),
		fetchRegions				= listsService.getAllRegions(),
		fetchSocialWorkerPositions	= listsService.getAllSocialWorkerPositions(),
		fetchStates					= listsService.getAllStates( stateOptions ),
		fetchWaysToHearAboutMARE	= listsService.getAllWaysToHearAboutMARE( waysToHearOptions ),
		fetchMailingLists			= mailingListService.getMailingLists(),
		fetchSidebarItems			= pageService.getSidebarItems();

	Promise.all( [ fetchChildTypes, fetchCitiesAndTowns, fetchGenders, fetchLanguages,
				   fetchLegalStatuses, fetchRaces, fetchRegions, fetchSocialWorkerPositions,
				   fetchStates, fetchWaysToHearAboutMARE, fetchMailingLists, fetchSidebarItems ] )
		.then( values => {
			// assign local variables to the values returned by the promises
			const [ childTypes, citiesAndTowns, genders, languages,
					legalStatuses, races, regions, socialWorkerPositions,
					states, waysToHearAboutMARE, mailingLists, sidebarItems ] = values;
			// the sidebar items are a success story and event in an array, assign local variables to the two objects
			const [ randomSuccessStory, randomEvent ] = sidebarItems;

			// assign properties to locals for access during templating
			locals.childTypes				= childTypes;
			locals.citiesAndTowns			= citiesAndTowns;
			locals.genders					= genders;
			locals.languages				= languages;
			locals.legalStatuses			= legalStatuses;
			locals.races					= races;
			locals.regions					= regions;
			locals.socialWorkerPositions	= socialWorkerPositions;
			locals.states					= states;
			locals.waysToHearAboutMARE		= waysToHearAboutMARE;
            locals.mailingLists				= mailingLists;
			locals.randomSuccessStory		= randomSuccessStory;
			locals.randomEvent				= randomEvent;

			if (typeof req.headers.referer !== 'undefined') {
				let recognizedReferers = ['/page/register-a-child', '/page/register-a-familys-homestudy', '/events/adoption-parties/', '/events/fundraising-events/'];
				recognizedReferers.forEach(path => {
					if (req.headers.referer.includes(path)) {
						locals.redirectUrl = req.headers.referer;
					}
				});
			}

			// set the layout to render with the right sidebar
			locals[ 'render-with-sidebar' ] = true;
			// render the view using the register.hbs template
			view.render( 'register' );
		})
		.catch( err => {
			// log an error for debugging purposes
			console.error( `error loading data for the registration page`, err );
			// render the view using the register.hbs template
			view.render( 'register' );
		});
};
