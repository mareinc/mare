const keystone									= require( 'keystone' );
const async										= require( 'async' );

// mappings used across imports
const mediaTypesMap								= require( '../middleware/data-migration-maps/media-type' );
const statesMap									= require( '../middleware/data-migration-maps/state' );
const regionsMap								= require( '../middleware/data-migration-maps/region' );
const outsideContactGroupsMap					= require( '../middleware/data-migration-maps/outside-contact-group' );
const mailingListsMap							= require( '../middleware/data-migration-maps/mailing-list' );
const childStatusesMap							= require( '../middleware/data-migration-maps/child-status' );
const gendersMap 								= require( '../middleware/data-migration-maps/gender' );
const languagesMap 								= require( '../middleware/data-migration-maps/language' );
const legalStatusesMap							= require( '../middleware/data-migration-maps/legal-status' );
const racesMap 									= require( '../middleware/data-migration-maps/race' );
const disabilityStatusesMap						= require( '../middleware/data-migration-maps/disability-status' );
const familyConstellationsMap					= require( '../middleware/data-migration-maps/family-constellation' );
const otherFamilyConstellationConsiderationsMap	= require( '../middleware/data-migration-maps/other-family-constellation-consideration' );
const mediaEligibilitiesMap						= require( '../middleware/data-migration-maps/media-eligibility' );
const disabilitiesMap							= require( '../middleware/data-migration-maps/disability' );
const closedReasonsMap							= require( '../middleware/data-migration-maps/closed-reason' );
const familyStatusesMap							= require( '../middleware/data-migration-maps/family-status' );
const cityRegionsMap							= require( '../middleware/data-migration-maps/city-region' );

// data imports
const sourcesImport								= require( '../middleware/data-migration-middleware/import-sources' );
const mediaFeaturesImport						= require( '../middleware/data-migration-middleware/import-media-features' );
const agenciesImport							= require( '../middleware/data-migration-middleware/import-agencies' );
const agencyContactsImport						= require( '../middleware/data-migration-middleware/import-agency-contacts' );
const outsideContactImport						= require( '../middleware/data-migration-middleware/import-outside-contacts' );
const socialWorkerImport						= require( '../middleware/data-migration-middleware/import-social-workers' );
const childrenImport							= require( '../middleware/data-migration-middleware/import-children' );
const childMediaEligibilityImport				= require( '../middleware/data-migration-middleware/import-child-media-eligibility' );
const childDisabilitiesImport					= require( '../middleware/data-migration-middleware/import-child-disabilities' );
const childSiblingsImport						= require( '../middleware/data-migration-middleware/import-child-siblings' );
const mediaFeatureChildImport					= require( '../middleware/data-migration-middleware/import-media-feature-child' );
const familiesImport							= require( '../middleware/data-migration-middleware/import-families' );
const familySocialWorkersImport					= require( '../middleware/data-migration-middleware/import-family-social-workers' );
const familyRacePreferencesImport				= require( '../middleware/data-migration-middleware/import-family-race-preferences' );
const familyDisabilityPreferencesImport			= require( '../middleware/data-migration-middleware/import-family-disability-preferences' );
const familySupportServicesImport				= require( '../middleware/data-migration-middleware/import-family-support-services' );
// const eventsImport								= require( '../middleware/data-migration-middleware/import-events' );
// const inquiriesExtranetImport					= require( '../middleware/data-migration-middleware/import-inquiries-extranet' );
// const inquiriesCallImport						= require( '../middleware/data-migration-middleware/import-inquiries-calls');
// const internalNotesImport						= require( '../middleware/data-migration-middleware/import-internal-notes' );
// const mailingListsImport    					= require( '../middleware/data-migration-middleware/import-mailing-lists');
// const placementsImport							= require( '../middleware/data-migration-middleware/import-placements' );

exports = module.exports = ( req, res ) => {
    'use strict';

    const view = new keystone.View( req, res );

    const locals = res.locals;
	// create a namespace for all migration data needed for the import
	// this makes clearing memory much easier
	locals.migration = locals.migration || {
		maps: {},
		data: {}
	};
	// array to store progress messages
	locals.migrationResults = [];

    async.series([
		// map setup
		done => { mediaTypesMap.getMediaTypesMap( req, res, done ); },
		done => { statesMap.getStatesMap( req, res, done); },
		done => { regionsMap.getRegionsMap( req, res, done ); },
		done => { outsideContactGroupsMap.getOutsideContactGroupsMap( req, res, done ); },
		done => { mailingListsMap.getMailingListsMap( req, res, done ); },
		done => { childStatusesMap.getChildStatusesMap( req, res, done ); },
		done => { gendersMap.getGendersMap( req, res, done ); },
		done => { languagesMap.getLanguagesMap( req, res, done ); },
		done => { legalStatusesMap.getLegalStatusesMap( req, res, done ); },
		done => { racesMap.getRacesMap( req, res, done ); },
		done => { disabilityStatusesMap.getDisabilityStatusesMap( req, res, done ); },
		done => { familyConstellationsMap.getFamilyConstellationsMap( req, res, done ); },
		done => { otherFamilyConstellationConsiderationsMap.getOtherFamilyConstellationConsiderationsMap( req, res, done ); },
		done => { mediaEligibilitiesMap.getMediaEligibilitiesMap( req, res, done ); },
		done => { disabilitiesMap.getDisabilitiesMap( req, res, done ); },
		done => { closedReasonsMap.getClosedReasonsMap( req, res, done ); },
		done => { familyStatusesMap.getFamilyStatusesMap( req, res, done ); },
		done => { cityRegionsMap.getCityRegionsMap( req, res, done ); },

		// data import

		// done => { sourcesImport.importSources( req, res, done ); },											// done
		// done => { mediaFeaturesImport.importMediaFeatures( req, res, done ); },								// done
		// done => { agenciesImport.importAgencies( req, res, done ); },										// done
		// done => { outsideContactImport.importOutsideContacts( req, res, done ); },							// done
		// done => { socialWorkerImport.importSocialWorkers( req, res, done ); },								// done
		// done => { agencyContactsImport.appendAgencyContacts( req, res, done ); },							// done
		// IMPORTANT: NEED TO CHANGE THE CHILD PRE / POST SAVE HERE
		// IMPORTANT: NEED TO CHANGE FIRST CHANGE HISTORY RECORD TO READ 'DATE IMPORTED FROM THE OLD SYSTEM'
		// done => { childrenImport.importChildren( req, res, done ); },										// done
		// IMPORTANT: NEED TO CHANGE THE CHILD PRE / POST SAVE HERE
		// done => { childMediaEligibilityImport.appendMediaEligibilities( req, res, done ); },				// done
		// done => { childDisabilitiesImport.appendDisabilities( req, res, done ); },							// done
		// IMPORTANT: NEED TO CHANGE THE CHILD PRE / POST SAVE HERE
		// done => { childSiblingsImport.appendSiblings( req, res, done ); },									// done
		// done => { mediaFeatureChildImport.appendChildren( req, res, done ); },								// done

																								// 25 left undone below

		// done => { childInternalNotesImport.importInternalNotes( req, res, done ); }			// not done
		// IMPORTANT: NEED TO CHANGE THE FAMILY PRE / POST SAVE HERE
		// done => { familiesImport.importFamilies( req, res, done ); },									// done
		// done => { familySocialWorkersImport.appendFamilySocialWorkers( req, res, done ); },				// done
		// done => { familyRacePreferencesImport.appendFamilyRacePreferences( req, res, done ); },			// done
		// done => { familyDisabilityPreferencesImport.appendFamilyDisabilityPreferences( req, res, done ); },	// done
		done => { familySupportServicesImport.appendFamilySupportServices( req, res, done ); },															// not done
			// family child																		// not done
			// family contact																	// not done
			// ext family																		// not done
			// ext family race preference														// not done
			// recruitment checklist															// not done
			// file attachment																	// not done
			// placement source																	// not done
		// done => { placementsImport.importPlacements( req, res, done ); }, 					// not done These are in the child records
			// family placement																	// not done
			// pending match																	// not done
			// pending termination																// not done
			// pending termination item															// not done
		// done => { inquiriesExtranetImport.importInquiries( req, res, done ); },				// not done
		// done => { inquiriesCallImport.importInquiries( req, res, done ); },					// not done
			// ext automatic inquiry history													// not done
			// call agency																		// not done
			// call child																		// not done
			// call note																		// not done
		// done => { eventsImport.importEvents( req, res, done ); },							// not done
			// event attendee																	// not done
		// done => { mailingListsImport.importMailingLists( req, res, done ); },				// not done
			// mailing list subscription														// not done
		// done => { internalNotesImport.importInternalNotes( req, res, done ); }				// not done

		
	], () => {
		// Set the layout to render without the right sidebar
		locals[ 'render-with-sidebar' ] = false;
		locals[ 'render-without-header' ] = true;
		// Render the view once all the data has been retrieved
		view.render( 'data-migration-output' );

	});

};
