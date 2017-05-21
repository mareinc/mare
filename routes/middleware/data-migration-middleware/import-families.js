const keystone					= require( 'keystone' );
const Family 					= keystone.list( 'Family' );
// utility middleware
const utilityFunctions			= require( './utilities_functions' );
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all families.  This is created here to be available to multiple functions below
let families;
// create references to the maps that we stored on locals.  These are bound here to be available to multiple functions below since res can't be passed to the generator
let statesMap,
	gendersMap,
	languagesMap,
	legalStatusesMap,
	racesMap,
	disabilityStatusesMap,
	disabilitiesMap,
	familyConstellationsMap,
	closedReasonsMap,
	familyStatusesMap,
	cityRegionsMap;

// expose done to be available to all functions below
let familyImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.importFamilies = ( req, res, done ) => {
	// expose the maps we'll need for this import
	statesMap				= res.locals.migration.maps.states;
	gendersMap				= res.locals.migration.maps.genders;
	languagesMap			= res.locals.migration.maps.languages;
	legalStatusesMap		= res.locals.migration.maps.legalStatuses;
	racesMap				= res.locals.migration.maps.races;
	disabilityStatusesMap	= res.locals.migration.maps.disabilityStatuses;
	disabilitiesMap			= res.locals.migration.maps.disabilities;
	familyConstellationsMap	= res.locals.migration.maps.familyConstellations;
	closedReasonsMap		= res.locals.migration.maps.closedReasons;
	familyStatusesMap		= res.locals.migration.maps.familyStatuses;
	cityRegionsMap			= res.locals.migration.maps.cityRegions;
	// expose done to our generator
	familyImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the families CSV file to JSON
	const familiesLoaded = new Promise( ( resolve, reject ) => {
		// attempt to convert the families
		CSVConversionMiddleware.fetchFamilies( resolve, reject );
	});
	// if the file was successfully converted, it will return the array of families
	familiesLoaded.then( familiesArray => {
		// store the families in a variable accessible throughout this file
		families = familiesArray;
		// kick off the first run of our generator
		familyGenerator.next();
	// if there was an error converting the families file
	}).catch( reason => {
		console.error( `error processing families` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

/* a generator to allow us to control the processing of each record */
module.exports.generateFamilies = function* generateFamilies() {

	console.log( `creating families in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords			= families.length,
		remainingRecords 		= totalRecords,
		batchCount				= 100, // number of records to be process simultaneously
		familyNumber			= 0; // keeps track of the current family number being processed.  Used for batch processing
	// loop through each family object we need to create a record for
	for( let family of families ) {
		// increment the familyNumber
		familyNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( familyNumber % batchCount === 0 ) {
			yield exports.createFamilyRecord( family, true );
		} else {
			exports.createFamilyRecord( family, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `families remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			console.log( `the following records weren't saved correctly:` );

			importErrors.forEach( error => {
				console.log( error )
			});

			const resultsMessage = `finished creating ${ totalRecords } families in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Families',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return familyImportComplete();
		}
	}
};

// a function paired with the generator to create a record and request the generator to process the next once finished
module.exports.createFamilyRecord = ( family, pauseUntilSaved ) => {

	// create variables to hold the primary language _id and all other language _ids
	let primaryLanguage,
		otherLanguagesArray = [],
		// set gender matching preferences
		matchingGenderPreferences = [],
		// set legal status matching preferences with a default of wanting to see legally free kids
		matchingLegalStatusPreferences = [ legalStatusesMap[ 'F' ] ];

	if( family.accept_female === 'Y' ) { matchingGenderPreferences.push( gendersMap[ 'F' ] ); }
	if( family.accept_male === 'Y' ) { matchingGenderPreferences.push( gendersMap[ 'M' ] ); }

	if( family.accept_legal_risk === 'Y' ) { matchingLegalStatusPreferences.push( legalStatusesMap[ 'R' ] ); }
	
	// if the record has a primary language listed
	if( family.primary_language ) {
		// split the string on commas to create an array of languages
		let allLanguagesArray = family.primary_language.trim().replace( '/', ',' )
														.replace( 'Haitian Creole/Eng', 'french, english' ) // This has to be done since the space is used as a delimeter in some cases
													   .replace( '-', ',' )
													   .replace( ' ', ',' )
													   .split( ',' ); // redo to get dash handling back, add break on space ( 'english spanish' ) and / ( French/English )
		// store the first language as the primary and all other languages in other
		const [ primary, ...other ] = allLanguagesArray;
		// map the primary language listed to the _id value in the new system
		primaryLanguage = languagesMap[ primary.toLowerCase().trim() ];
		// loop through the other languages if any exist
		for( let language of other ) {
			// map each language to the _id value in the new system and push it to the other languages array
			otherLanguagesArray.push( languagesMap[ language.toLowerCase().trim() ] );
		}
	// if the record doesn't have a primary language listed
	} else {
		// default the primary language to English
		primaryLanguage = languagesMap[ 'english' ];
	}

	// tests for missing required things
	if( !family.family_constellation ) {
		console.log( 'break here' );
	}
	if( !primaryLanguage ) {
		console.log( 'break here' );
	}

	// populate instance for Family object
	let newFamily = new Family.model({
		// every family needs an email, this will generate a placeholder which will be updated during the family contacts import
		email: `placeholder0${ family.fam_id }@email.com`,
		// every family needs a password, this will generate a placeholder which will be updated during the family contacts import
		password: `${ family.fam_id }`,

		isActive: family.status === 'A' || family.status === 'H',

		registrationNumber: family.fam_id,
		initialContact: family.listing_date ? new Date( family.listing_date ) : undefined,
		flagCalls: family.flag_calls === 'Y',
		familyConstellation: familyConstellationsMap[ family.family_constellation ],	// this is required in the new system

		language: primaryLanguage,
		otherLanguages: otherLanguagesArray,

		address: {
			street1: family.address_1,
			street2: family.address_2,
			city: family.city,
			state: statesMap[ family.state ],
			zipCode: utilityFunctions.padZipCode( family.zip ),
			region: cityRegionsMap[ family.city ]
		},

		homePhone: family.home_phone,

		numberOfChildren: 0, // This will be updated in the family child import

		stages: {
			gatheringInformation: {
				started: family.is_gathering_info === 'Y',
				date: family.gathering_info_date ? new Date( family.gathering_info_date ) : undefined
			},
			lookingForAgency: {
				started: family.is_looking_for_agency === 'Y',
				date: family.looking_for_agency_date ? new Date( family.looking_for_agency_date ) : undefined
			},
			workingWithAgency: {
				started: family.is_working_with_agency === 'Y',
				date: family.working_with_agency_date ? new Date( family.working_with_agency_date ) : undefined
			},
			MAPPTrainingCompleted: {
				completed: !!family.mapp_training_date,	// no match for this
				date: family.mapp_training_date ? new Date( family.mapp_training_date ) : undefined
			}
		},

		homestudy: {
			completed: family.is_home_studied === 'Y',
			initialDate: family.home_study_date ? new Date( family.home_study_date ) : undefined,
			mostRecentDate: family.home_study_date ? new Date( family.home_study_date ) : undefined // This is correct per Lisa, it's not in the old system
		},

		onlineMatching: { // This may come out if the new system handles this funtionality correctly
			started: !!family.online_matching_date, // this comes from the extranet in the old system
			date: family.online_matching_date ? new Date( family.online_matching_date ) : undefined
		},

		registeredWithMARE: {
			registered: family.is_registered === 'Y',
			date: family.registered_date ? new Date( family.registered_date ) : undefined,
			status: familyStatusesMap[ family.status ]
		},

		familyProfile: {
			created: family.has_family_profile === 'Y',
			date: family.family_profile_date ? new Date( family.family_profile_date ) : undefined
		},

		closed: {
			isClosed: family.is_closed === 'Y',
			date: family.closed_date ? new Date( family.closed_date ) : undefined,
			reason: closedReasonsMap[ family.closed_reason ]
		},
	
		infoPacket: { // English/Electronic, English/Hardcopy, Spanish/Electronic, Spanish/Hardcopy, None
			packet: family.info_pack === 'EE' || family.info_pack === 'EH' ? 'English' :
					family.info_pack === 'SE' || family.info_pack === 'SH' ? 'Spanish' :
					'none',
			date: family.info_pack_sent_date ? new Date( family.info_pack_sent_date ) : undefined,
			notes: family.info_pack_notes
		},

		matchingPreferences: {
			gender: matchingGenderPreferences,
			legalStatus: matchingLegalStatusPreferences,

			adoptionAges: {
				from: family.adoption_ages_from ? parseInt( family.adoption_ages_from, 10 ) : undefined,
				to: family.adoption_ages_to ? parseInt( family.adoption_ages_to, 10 ) : undefined
			},

			numberOfChildrenToAdopt: family.number_of_children_to_adopt ? parseInt( family.number_of_children_to_adopt, 10 ) : undefined,
			siblingContact: family.accept_sibling_contact === 'Y',
			birthFamilyContact: family.accept_birth_family_contact === 'Y',
			
			maxNeeds: { // if these don't exist, we'll need a default value
				physical: disabilityStatusesMap[ family.max_physical_dst_id ]  || 'none',
				intellectual: disabilityStatusesMap[ family.max_intellectual_dst_id ] || 'none',
				emotional: disabilityStatusesMap[ family.max_emotional_dst_id ] || 'none'
			}
		}

	});

	newFamily.save( ( err, savedModel ) => {
		// if we run into an error
		if( err ) {
			// store a reference to the entry that caused the error
			importErrors.push( { id: family.fam_id, error: err.err } );
		}

		// fire off the next iteration of our generator after pausing
		if( pauseUntilSaved ) {
			familyGenerator.next();
		}
	});
};

// instantiates the generator used to create family records at a regulated rate
const familyGenerator = exports.generateFamilies();