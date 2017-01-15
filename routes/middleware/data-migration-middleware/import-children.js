// const fileSystem			= require( 'fs' );
// const formatDate			= require( 'dateformat' );
const keystone				= require( 'keystone' );
const async					= require( 'async' );
const Child 				= keystone.list( 'Child' );
// utility middleware
const utilityFunctions			= require( './utilities_functions' );
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all children.  This is created here to be available to multiple functions below
let children;
// create references to the maps that we stored on locals.  These are bound here to be available to multiple functions below since res can't be passed to the generator
let childStatusesMap,
	gendersMap,
	languagesMap,
	legalStatusesMap,
	racesMap,
	disabilitiesMap,
	familyConstellationsMap,
	otherFamilyConstellationConsiderationsMap;
// expose done to be available to all functions below
let childImportComplete;
// expose the array storing progress through the migration run
let migrationResults;

module.exports.importChildren = ( req, res, done ) => {
	// expose the maps we'll need for this import
	childStatusesMap							= res.locals.migration.maps.childStatuses;
	gendersMap									= res.locals.migration.maps.genders;
	languagesMap								= res.locals.migration.maps.languages;
	legalStatusesMap							= res.locals.migration.maps.legalStatuses;
	racesMap									= res.locals.migration.maps.races;
	disabilitiesMap								= res.locals.migration.maps.disabilities;
	familyConstellationsMap						= res.locals.migration.maps.familyConstellations;
	otherFamilyConstellationConsiderationsMap	= res.locals.migration.maps.otherFamilyConstellationConsiderations;
	// expose done to our generator
	childImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the children CSV file to JSON
	const childrenLoaded = new Promise( ( resolve, reject ) => {
		// attempt to convert the children
		CSVConversionMiddleware.fetchChildren( resolve, reject );
	});
	// if the file was successfully converted, it will return the array of children
	childrenLoaded.then( childrenArray => {
		// store the children in a variable accessible throughout this file
		children = childrenArray;
		// kick off the first run of our generator
		childGenerator.next();
	// if there was an error converting the children file
	}).catch( reason => {
		console.error( `error processing children` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

/* a generator to allow us to control the processing of each record */
module.exports.generateChildren = function* generateChildren() {

	console.log( `creating children in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords			= children.length,
		remainingRecords 		= totalRecords,
		batchCount				= 100, // number of records to be process simultaneously
		childNumber				= 0; // keeps track of the current child number being processed.  Used for batch processing
	// loop through each child object we need to create a record for
	for( let child of children ) {
		// increment the childNumber
		childNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( childNumber % batchCount === 0 ) {
			yield exports.createChildRecord( child, true );
		} else {
			exports.createChildRecord( child, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			const resultsMessage = `finished creating ${ totalRecords } children in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Children',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return childImportComplete();
		}
	}
};

// a function paired with the generator to create a record and request the generator to process the next once finished
module.exports.createChildRecord = ( child, pauseUntilSaved ) => {

	// FAMILY CONSTELLATION CONSIDERATIONS: QUESTION FOR LISA
	// I mapped can_place_in_two_parent_home to MFC ( is this right? )
	// entries for female/female and male/male, as well as single female and single male
	// missing single gay female/male and single straight female/male ( Is this ok? )
	// nothing maps to unknown, should we say unknown if no other value exists?
	// all set here!!!

	let recommendedFamilyConstellations = [],
		otherFamilyConstellationConsiderations = [],
		languages = [];

	if( child.can_place_in_two_parent_home === 'Y' ) { recommendedFamilyConstellations.push( familyConstellationsMap[ 'MFC' ] ); }
	if( child.can_place_with_two_females === 'Y' ) { recommendedFamilyConstellations.push( familyConstellationsMap[ 'FFC' ] ); }
	if( child.can_place_with_two_males === 'Y' ) { recommendedFamilyConstellations.push( familyConstellationsMap[ 'MMC' ] ); }
	if( child.can_place_with_single_female === 'Y' ) { recommendedFamilyConstellations.push( familyConstellationsMap[ 'SIF' ] ); }
	if( child.can_place_with_single_male === 'Y' ) { recommendedFamilyConstellations.push( familyConstellationsMap[ 'SIM' ] ); }
	
	if( child.can_place_in_childless_home === 'Y' ) { otherFamilyConstellationConsiderations.push( otherFamilyConstellationConsiderationsMap[ 'childless home' ] ); }
	if( child.can_place_in_multi_child_home === 'Y' ) { otherFamilyConstellationConsiderations.push( otherFamilyConstellationConsiderationsMap[ 'multi-child home' ] ); }
	if( child.require_younger_children === 'Y' ) { otherFamilyConstellationConsiderations.push( otherFamilyConstellationConsiderationsMap[ 'requires younger children' ] ); }
	if( child.require_older_children === 'Y' ) { otherFamilyConstellationConsiderations.push( otherFamilyConstellationConsiderationsMap[ 'requires older children' ] ); }

	if( child.primary_language ) { languages.push( languagesMap[ child.primary_language ] ); }
	// grab the IDs of the social worker associated with the child
	// NOTE: What happens if neither are populated, the promise will reject and the child won't save :(
	let adoptionWorkerId = child.adoption_agc_id,
		recruitmentWorkerId = child.recruitment_agc_id;
	// create a promise for fetching the adoption worker associated with the child
	const adoptionWorkerLoaded = new Promise( ( resolve, reject ) => {
		utilityModelFetch.getSocialWorkerById( resolve, reject, adoptionWorkerId );
	});
	// create a promise for fetching the recruitment worker associated with the child
	const recruitmentWorkerLoaded = new Promise( ( resolve, reject ) => {
		utilityModelFetch.getSocialWorkerById( resolve, reject, recruitmentWorkerId );
	});
	// once we've fetched the child's social worker
	Promise.all( [ adoptionWorkerLoaded, recruitmentWorkerLoaded ] ).then( socialWorkers => {
		// destructure the adoption worker and recruitment worker from the returned promises in local variables
		const adoptionWorker = socialWorkers[ 0 ];
		const recruitmentWorker = socialWorkers[ 1 ];

		// populate fields of a new Child object
		let newChild = new Child.model({

			// Display Options
			siteVisibility: child.legal_status === 'R' ? 'registered social workers and families' : 'everyone',
			isVisibleInGallery: child.is_on_mare_web === 'Y',

			// Child Information
			registrationNumber: parseInt( child.chd_id, 10 ),
			registrationDate: new Date( child.registered_date ),
			name: {
				first: child.first_name,
				middle: child.middle_name,
				last: child.last_name,
				alias: child.alias,
				nickName: child.nickname
			},
			birthDate: new Date( child.date_of_birth ),
			languages: languages,
			statusChangeDate: new Date( child.last_status_change_datetime ),
			status: childStatusesMap[ child.status ],
			gender: gendersMap[ child.gender ],
			race: racesMap[ child.rce_id ], // NOTE: should this be an array of ids
			raceNotes: child.race_note,
			legalStatus: legalStatusesMap[ child.legal_status ],

			hasContactWithSiblings: child.allow_sibling_contact === 'Y',
			siblingTypeOfContact: child.sibling_contact_note,
			mustBePlacedWithSiblings: !!child.sibling_group_id,
			hasContactWithBirthFamily: child.allow_birth_family_contact === 'Y',
			birthFamilyTypeOfContact: child.birth_family_contact_note,

			// Special Needs
			physicalNeeds: disabilitiesMap[ child.physical_dst_id ],
			physicalNeedsDescription: child.physical_disability_comment,
			emotionalNeeds: disabilitiesMap[ child.emotional_dst_id ],
			emotionalNeedsDescription: child.emotional_disability_comment,
			intellectualNeeds: disabilitiesMap[ child.intellectual_dst_id ],
			intellectualNeedsDescription: child.intellectual_disability_comment,
			healthNotesOld: child.health_notes,

			// Placement Considerations	
			recommendedFamilyConstellation: recommendedFamilyConstellations,
			otherFamilyConstellationConsideration: otherFamilyConstellationConsiderations,

			// Agency Information
			registeredBy: child.registered_by === 'A' ? 'adoption worker' :
						  child.registered_by === 'R' ? 'recruitment worker' :
														'unknown',
			adoptionWorker: adoptionWorker ? adoptionWorker.get( '_id' ) : undefined,
			recruitmentWorker: recruitmentWorker ? recruitmentWorker.get( '_id' ) : undefined,
			
			// Photolisting Information
			hasPhotolistingWriteup: child.have_photolisting_writeup === 'Y',
			photolistingWriteupDate: child.photolisting_writeup_date,
			hasPhotolistingPhoto: child.have_photolisting_photo === 'Y',
			photolistingPhotoDate: child.photolisting_photo_date ? new Date( child.photolisting_photo_date ) : undefined,
			isCurrentlyInPhotoListing: child.in_photolisting === 'Y', // Check this as 'Y' or 'N'
			dateOfLastPhotoListing: child.photolisting_date ? new Date( child.photolisting_date ) : undefined,
			photolistingPageNumber: child.photolisting_page,
			previousPhotolistingPageNumber: child.previous_photolisting_page,
			extranetUrl: child.profile_url,

			// Recruitment Options	
			hasVideoSnapshot: child.have_video_snapshot === 'Y',
			videoSnapshotDate: child.video_snapshot_date ? new Date( child.video_snapshot_date ) : undefined,
			onMAREWebsite: child.is_on_mare_web === 'Y',
			onAdoptuskids: child.is_on_adoptuskids === 'Y',
			
			// onAdoptuskidsDate: 'not done', // NOT IN THE OLD SYSTEM, see notes for field below, we can determine it based on the date
			// wednesdaysChild: 'not done', // see recruitment checklist, link through the media outlets // NOTE: depending on whether part of sibling group, fill out the appropriate group below
			// wednesdaysChildDate: 'not done',
			// wednesdaysChildVideo: 'not done',
			// wednesdaysChildSiblingGroup: 'not done',
			// wednesdaysChildSiblingGroupDate: 'not done',
			// wednesdaysChildSiblingGroupVideo: 'not done',
			// coalitionMeeting: 'not done', // IGNORE, ROLLED INTO MATCHING EVENT
			// coalitionMeetingDate: 'not done', // IGNORE, ROLLED INTO MATCHING EVENT
			// matchingEvent: 'not done', // see recruitment checklist, link through the media outlets // see media outlet report.  NOTE: this is combined with coalition meeting in the old system, but info should go here
			// matchingEventDate: 'not done', // see recruitment checklist, link through the media outlets // see media outlet report.  NOTE: this is combined with coalition meeting in the old system, but info should go here
			// adoptionParties: 'not done', // REMOVE, SEE NOTES AT BOTTOM OF FILE
			// mediaEligibility: 'not done', // Need a map, all 300+ sources need to map to the categories in the new system, Lisa has an intern working on this
			locationAlert: child.on_media_location_alert === 'Y',
			place: child.media_location_alert_place
		});

		newChild.save( ( err, savedModel ) => {
			// if we run into an error
			if( err ) {
				// halt execution by throwing an error
				console.log( `error: ${ err }` );
				throw `[chd_id: ${ child.chd_id }] an error occured while saving ${ child.first_name } ${ child.last_name }.`;
			}

			// fire off the next iteration of our generator after pausing
			if( pauseUntilSaved ) {
				childGenerator.next();
			}
		});

	}).catch( reason => {

		console.error( `error processing child's social worker` );
		console.error( reason );
		// aborting the import
		return next();
	});
};

// instantiates the generator used to create child records at a regulated rate
const childGenerator = exports.generateChildren();

// chd_id
// registered_date
// sibling_group_id
// first_name
// middle_name
// last_name
// alias
// nickname
// status
// date_of_birth
// gender
// rce_id
// race_note
// legal_status
// number_of_siblings // NOTE: This is calculated automatically, we don't need it
// can_place_in_two_parent_home // NOTE: THIS MAY NOT BE USED CORRECTLY, SEE NOTE ABOVE AND TALK TO LISA
// can_place_with_two_females
// can_place_with_two_males
// can_place_with_single_female
// can_place_with_single_male
// can_place_in_childless_home
// can_place_in_multi_child_home
// require_older_children
// require_younger_children
// physical_dst_id
// emotional_dst_id
// intellectual_dst_id
// physical_disability_comment
// emotional_disability_comment
// intellectual_disability_comment
// in_therapy // NOTE: There's no field for this ( Y / N ), Lisa says we don't need it, it's not really used in the old system
// health_notes
// adoption_agc_id // NOTE: references Social Worker
// recruitment_agc_id // NOTE: references Social Worker
// notes // NOTE: does this become an internal note entry?  DO THIS!!!
// listing_date // NOTE: possibly year entered care since the fields are near eachother in the old system.  NO IT'S NOT, WE NEED TO CIRCLE BACK ON THIS FIELD!!!  Figure it out at the next meeting.  It's not online matching date
// allow_sibling_contact
// sibling_contact_note
// allow_birth_family_contact
// birth_family_contact_note
// have_media_documentation // ( Y / N ) // IGNORE!!!
// on_media_recruitment_hold // ( Y / N ) // IGNORE!!!
// media_recruitment_hold_date // date // IGNORE!!!
// have_media_photo // ( Y / N ) // IGNORE!!!
// media_photo_date // date // IGNORE!!!
// on_media_location_alert
// media_location_alert_place
// have_photolisting_writeup
// photolisting_writeup_date
// have_photolisting_photo // NOTE: linked with field below
// photolisting_photo_date
// in_photolisting
// photolisting_date
// photolisting_page
// previous_photolisting_page
// have_video_snapshot
// video_snapshot_date
// referral_packet_request_date // Add to child model
// referral_packet_send_date // Add to child model
// primary_language
// registered_by
// last_status_change_datetime
// profile_url
// is_on_mare_web
// is_on_adoptuskids
// is_on_online_matching // IGNORE!!!


// NEW FIELDS NEEDED:

// matched in mare database => went into all the registered families, matched against all the families.  This should go right above video snapshot.  A checkbox with a date box ( conditional ).  It would be nice to have multiple dates in there.  This should be a non-editable text field that appends the new text date to it whenever the thing is run via a button on the website.  In the interim, can we add a third field which is a just a text field where Lisa will put the families they determine are true matches and enter them here.  Pitch to Lisa a 'match' model to link to Child / Family.

// add referral packet fields ( 2 ) to match the old system.

// specialNeedsNotes NEEDS TO BE REMOVED FROM THE NEW SYSTEM

// Region for child should be a non-editable field that is drawn from the agency.  Child => Social Worker => Agency

// Add an Agency field to the Child record that has a link to the agency.  This goes at the top with Region below it

// CHECK THAT ADOPTION PARTIES CAN ONLY PULL FROM ADOPTION PARTY EVENTS.  REMOVE THE FIELD BECAUSE THERE WILL BE A RELATIONSHIP AT THE BOTTOM OF THE RECORD FOR EVENTS

// dateMovedToResidence needs to be non-required