const keystone									= require( 'keystone' );
const async										= require( 'async' );

// mappings used across imports
const mediaTypesMap								= require( '../middleware/data-migration-maps/media-type' );
const statesMap									= require( '../middleware/data-migration-maps/state' );
const regionsMap								= require( '../middleware/data-migration-maps/region' );
const contactGroupsMap							= require( '../middleware/data-migration-maps/outside-contact-group' );
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
const childTypesMap								= require( '../middleware/data-migration-maps/child-type' );
const inquiryMethodsMap							= require( '../middleware/data-migration-maps/inquiry-method' );

// data imports
const agenciesImport							= require( '../middleware/data-migration-middleware/import-agencies' );
const agencyContactsImport						= require( '../middleware/data-migration-middleware/import-agency-contacts' );
const adminImport								= require( '../middleware/data-migration-middleware/import-admin' );
const childrenImport							= require( '../middleware/data-migration-middleware/import-children' );
const childDisabilitiesImport					= require( '../middleware/data-migration-middleware/import-child-disabilities' );
const childMediaEligibilitiesImport				= require( '../middleware/data-migration-middleware/import-child-media-eligibilities' );
const childMediaFeaturesImport					= require( '../middleware/data-migration-middleware/import-child-media-features' );
const childRecruitmentChecklistImport			= require( '../middleware/data-migration-middleware/import-child-recruitment-checklists' );
const childSiblingsImport						= require( '../middleware/data-migration-middleware/import-child-siblings' );
const eventsImport								= require( '../middleware/data-migration-middleware/import-events' );
const eventAttendeeImport						= require( '../middleware/data-migration-middleware/import-event-attendees' );
const familiesImport							= require( '../middleware/data-migration-middleware/import-families' );
const familyChildrenImport						= require( '../middleware/data-migration-middleware/import-family-children' );
const familyContactsImport						= require( '../middleware/data-migration-middleware/import-family-contacts' );
const familyDisabilityPreferencesImport			= require( '../middleware/data-migration-middleware/import-family-disability-preferences' );
const familyRacePreferencesImport				= require( '../middleware/data-migration-middleware/import-family-race-preferences' );
const familySocialWorkersImport					= require( '../middleware/data-migration-middleware/import-family-social-workers' );
const familySupportServicesImport				= require( '../middleware/data-migration-middleware/import-family-support-services' );
const mediaFeaturesImport						= require( '../middleware/data-migration-middleware/import-media-features' );
const mediaFeatureChildImport					= require( '../middleware/data-migration-middleware/import-media-feature-child' );
const outsideContactImport						= require( '../middleware/data-migration-middleware/import-outside-contacts' );
const registeredPlacementsImport				= require( '../middleware/data-migration-middleware/import-registered-placements' );
const unregisteredPlacementsImport				= require( '../middleware/data-migration-middleware/import-unregistered-placements' );
const placementSourcesImport					= require( '../middleware/data-migration-middleware/import-placement-sources' );
const sourcesImport								= require( '../middleware/data-migration-middleware/import-sources' );
const socialWorkerImport						= require( '../middleware/data-migration-middleware/import-social-workers' );
const inquiriesImport							= require( '../middleware/data-migration-middleware/import-inquiries');
const inquiryAgenciesImport						= require( '../middleware/data-migration-middleware/import-inquiry-agencies' );
const inquiryChildrenImport						= require( '../middleware/data-migration-middleware/import-inquiry-children' );
const inquiryNotesImport						= require( '../middleware/data-migration-middleware/import-inquiry-notes' );
const mailingListSubscriptionsImport    		= require( '../middleware/data-migration-middleware/import-mailing-list-subscriptions');
const childInternalNotesImport					= require( '../middleware/data-migration-middleware/import-child-internal-notes' );
const familyInternalNotesImport					= require( '../middleware/data-migration-middleware/import-family-internal-notes' );

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
		done => { contactGroupsMap.getContactGroupsMap( req, res, done ); },
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
		done => { childTypesMap.getChildTypesMap( req, res, done ); },
		done => { inquiryMethodsMap.getInquiryMethodsMap( req, res, done ); },

		// data import

		// done => { adminImport.importAdmin( req, res, done ); },
		// done => { sourcesImport.importSources( req, res, done ); },
		// done => { mediaFeaturesImport.importMediaFeatures( req, res, done ); }, // notes have markup in them, probably need to strip this out (check display of content)
		// done => { agenciesImport.importAgencies( req, res, done ); },
		// done => { outsideContactImport.importOutsideContacts( req, res, done ); },

		// IMPORTANT: remove all social workers and social worker histories before running
		// IMPORTANT: remove 0.0.1-user_social-workers.js from the app_updates table
		// COMMAND TO REMOVE SOCIAL WORKERS: db.users.remove({ userType: "social worker" })
		// done => { socialWorkerImport.importSocialWorkers( req, res, done ); },
		// done => { agencyContactsImport.appendAgencyContacts( req, res, done ); },

		// IMPORTANT: remove all children and child histories before running
		// IMPORTANT: comment out the following in pre-save: setImages, setRegistrationNumber, setSiblingGroupFileName, updateMustBePlacedWithSiblingsCheckbox, updateGroupBio
		// IMPORTANT: comment out the following in post-save: updateSiblingFields, updateBookmarks
		// done => { childrenImport.importChildren( req, res, done ); },
		
		// IMPORTANT: comment out the entire pre-save and post-save hooks
		// IMPORTANT: this consumes a TON of memory, need to run with nodemon --inspect --max-old-space-size=4096 keystone
		// done => { childHistoriesImport.importChildHistories( req, res, done ) },								// not done - finish after go live
		// done => { childMediaEligibilitiesImport.appendMediaEligibilities( req, res, done ); },
		// done => { childDisabilitiesImport.appendDisabilities( req, res, done ); },
		
		// IMPORTANT: uncomment the pre-save hook and make only the following functions are active: setSiblingGroupFileName, updateMustBePlacedWithSiblingsCheckbox, updateGroupBio
		// IMPORTANT: uncomment the post-save hook and make only the following function is active: updateSiblingFields
		// done => { childSiblingsImport.appendSiblings( req, res, done ); },
		// done => { childRecruitmentChecklistImport.appendChildRecruitmentChecklists( req, res ,done ); },		// not done - don't need to do
		// done => { childMediaFeaturesImport.appendMediaFeatures( req, res, done ); },							// not done - don't think we need to do this, check with Lisa.  Possibly handled with mediaFeatureChildImport
		// IMPORTANT: the child pre/post save hooks can be restored
		// done => { mediaFeatureChildImport.appendChildren( req, res, done ); },
		
		// IMPORTANT: remove all families and family histories before running
		// IMPORTANT: comment out the following in pre-save: setHomestudyVerifiedDate, setFullName, setDisplayName, setFileName, setGalleryViewingPermissions
		// IMPORTANT: comment out this.setDisplayNameAndRegistrationLabel(); in the final .then() clause
		// COMMAND TO REMOVE FAMILIES: db.users.remove({ userType: "family" })
		// done => { familiesImport.importFamilies( req, res, done ); },
		
		// IMPORTANT: comment out the entire pre-save and post-save hooks
		// done => { familySocialWorkersImport.appendFamilySocialWorkers( req, res, done ); },
		// done => { familyRacePreferencesImport.appendFamilyRacePreferences( req, res, done ); },
		// done => { familyDisabilityPreferencesImport.appendFamilyDisabilityPreferences( req, res, done ); },
		// done => { familySupportServicesImport.appendFamilySupportServices( req, res, done ); },
		// IMPORTANT: uncomment the pre-save hook and make only the following functions active: setFullName, setDisplayName, and setFileName
		// done => { familyContactsImport.appendFamilyContacts( req, res, done ); },
		// IMPORTANT: comment out the entire pre-save and post-save hooks
		// done => { familyChildrenImport.appendFamilyChildren( req, res, done ); },
		// done => { familyRecruitmentChecklistImport.appendFamilyRecruitmentChecklists( req, res ,done ); // not done // DON'T NEED TO DO

		// 13 left undone below

		// done => { registeredPlacementsImport.importPlacements( req, res, done ); },
		// done => { unregisteredPlacementsImport.importPlacements( req, res, done ); },
		// done => { placementSourcesImport.appendPlacementSources( req, res, done ); },
		// done => { inquiriesImport.importInquiries( req, res, done ); },
		// done => { inquiryAgenciesImport.appendInquiryAgencies( req, res, done ); },
		// done => { inquiryChildrenImport.appendInquiryChildren( req, res, done ); },
		// done => { inquiryNotesImport.appendInquiryNotes( req, res, done ); },
		// done => { eventsImport.importEvents( req, res, done ); },
		// done => { eventAttendeeImport.appendEventAttendees( req, res, done ); },
		// done => { mailingListSubscriptionsImport.importMailingListSubscriptions( req, res, done ); },
		// done => { childInternalNotesImport.importInternalNotes( req, res, done ); },
		done => { familyInternalNotesImport.importInternalNotes( req, res, done ); },
		// file attachment  															// not done

		
	], () => {
		// Set the layout to render without the right sidebar
		locals[ 'render-with-sidebar' ] = false;
		// Render the view once all the data has been retrieved
		view.render( 'data-migration-output' );

	});
};
