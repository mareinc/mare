const csv									= require( 'csvtojson' );
// migration file locations
const sourcesFilePath						= './migration-data/csv-data/recruitment_source.csv';
const mediaFeaturesFilePath					= './migration-data/csv-data/media_feature.csv';
const agenciesFilePath						= './migration-data/csv-data/agency.csv';
const agencyContactsFilePath				= './migration-data/csv-data/agency_contact.csv';
const outsideContactsFilePath 				= './migration-data/csv-data/outside_contact.csv';
const inquiriesFilePath						= './migration-data/csv-data/ext_inquiry.csv';
const socialWorkersFilePath					= './migration-data/csv-data/agency_contact.csv';
const childrenFilePath						= './migration-data/csv-data/child.csv';
const childDisabilitiesFilePath				= './migration-data/csv-data/child_special_need.csv';
const mediaFeatureChildrenFilePath			= './migration-data/csv-data/media_feature_child.csv';
const mediaEligibilitiesFilePath			= './migration-data/csv-data/media_eligibility.csv';
const familiesFilePath						= './migration-data/csv-data/family.csv';
const familyRacePreferencesFilePath			= './migration-data/csv-data/family_race_preference.csv';
const familyDisabilityPreferencesFilePath	= './migration-data/csv-data/family_special_need.csv';
const familySupportServicesFilePath			= './migration-data/csv-data/family_support_service.csv';

exports.fetchSources = ( resolve, reject ) => {
	
	console.log( `fetching sources from CSV` );

	// fetch all records from the sources csv file
	csv().fromFile( sourcesFilePath )
		// wait until the whole file has been parsed into an array of objects
		.on( 'end_parsed', sourcesArray => {
			console.log( `sources fetched` );
			// resolve the promise with the array of source objects
			resolve( sourcesArray );
		})
		.on( 'error', err => {
			console.error( `error fetching sources or converting to JSON => ${ err }` );
			reject();
		});
};

exports.fetchMediaFeatures = ( resolve, reject ) => {
	
	console.log( `fetching media features from CSV` );

	// fetch all records from the media features csv file
	csv().fromFile( mediaFeaturesFilePath )
		// wait until the whole file has been parsed into an array of objects
		.on( 'end_parsed', mediaFeaturesArray => {
			console.log( `media features fetched` );
			// resolve the promise with the array of source objects
			resolve( mediaFeaturesArray );
		})
		.on( 'error', err => {
			console.error( `error fetching media features or converting to JSON => ${ err }` );
			reject();
		});
};

exports.fetchAgencies = ( resolve, reject ) => {
	
	console.log( `fetching agencies from CSV` );

	// fetch all records from the agency csv file
	csv().fromFile( agenciesFilePath )
		// wait until the whole file has been parsed into an array of objects
		.on( 'end_parsed', agencyArray => {
			console.log( `agencies fetched` );
			// resolve the promise with the array of agency objects
			resolve( agencyArray );
		})
		.on( 'error', err => {
			console.error( `error fetching agencies or converting to JSON => ${ err }` );
			reject();
		});
};

exports.fetchAgencyContacts = ( resolve, reject ) => {
	
	console.log( `fetching agency contacts from CSV` );

	// fetch all records from the agency contact csv file
	csv().fromFile( agencyContactsFilePath )
		// wait until the whole file has been parsed into an array of objects
		.on( 'end_parsed', agencyContactArray => {
			console.log( `agencies fetched` );
			// resolve the promise with the array of agency contact objects
			resolve( agencyContactArray );
		})
		.on( 'error', err => {
			console.error( `error fetching agency contacts or converting to JSON => ${ err }` );
			reject();
		});
};

exports.fetchOutsideContacts = ( resolve, reject ) => {
	
	console.log( `fetching outside contacts from CSV` );

	// fetch all records from the extranet inquiry csv file
	csv().fromFile( outsideContactsFilePath )
		// wait until the whole file has been parsed into an array of objects
		.on( 'end_parsed', outsideContactsArray => {
			console.log( `outside contact groups fetched` );
			// resolve the promise with the array of outside contact objects
			resolve( outsideContactsArray );
		})
		.on( 'error', err => {
			console.error( `error fetching outside contacts or converting to JSON => ${ err }` );
			reject();
		});
};

exports.fetchInquiries = ( resolve, reject ) => {
	
	console.log( `fetching inquiries from CSV` );

	// fetch all records from the extranet inquiry csv file
	csv().fromFile( inquiriesFilePath )
		// wait until the whole file has been parsed into an array of objects
		.on( 'end_parsed', inquiriesArray => {
			console.log( `inquiries fetched` );
			// resolve the promise with the array of inquiry objects
			resolve( inquiriesArray );
		})
		.on( 'error', err => {
			console.error( `error fetching inquiries or converting to JSON => ${ err }` );
			reject();
		});
};

exports.fetchSocialWorkers = ( resolve, reject ) => {
	
	console.log( `fetching social workers from CSV` );

	// fetch all records from the extranet social worker csv file
	csv().fromFile( socialWorkersFilePath )
		// wait until the whole file has been parsed into an array of objects
		.on( 'end_parsed', socialWorkersArray => {
			console.log( `social workers fetched` );
			// resolve the promise with the array of social worker objects
			resolve( socialWorkersArray );
		})
		.on( 'error', err => {
			console.error( `error fetching social workers or converting to JSON => ${ err }` );
			reject();
		});
};

exports.fetchChildren = ( resolve, reject ) => {
	
	console.log( `fetching children from CSV` );

	// fetch all records from the children csv file
	csv().fromFile( childrenFilePath )
		// wait until the whole file has been parsed into an array of objects
		.on( 'end_parsed', childrenArray => {
			console.log( `children fetched` );
			// resolve the promise with the array of child objects
			resolve( childrenArray );
		})
		.on( 'error', err => {
			console.error( `error fetching children or converting to JSON => ${ err }` );
			reject();
		});
};

exports.fetchChildDisabilities = ( resolve, reject ) => {
	
	console.log( `fetching child disabilities from CSV` );

	// fetch all records from the child disabilities csv file
	csv().fromFile( childDisabilitiesFilePath )
		// wait until the whole file has been parsed into an array of objects
		.on( 'end_parsed', disabilitiesArray => {
			console.log( `child disabilities fetched` );
			// resolve the promise with the array of disability objects
			resolve( disabilitiesArray );
		})
		.on( 'error', err => {
			console.error( `error fetching child disabilities or converting to JSON => ${ err }` );
			reject();
		});
};

exports.fetchMediaFeatureChildren = ( resolve, reject ) => {
	
	console.log( `fetching media feature children from CSV` );

	// fetch all records from the media feature children csv file
	csv().fromFile( mediaFeatureChildrenFilePath )
		// wait until the whole file has been parsed into an array of objects
		.on( 'end_parsed', mediaFeatureChildrenArray => {
			console.log( `media feature children fetched` );
			// resolve the promise with the array of disability objects
			resolve( mediaFeatureChildrenArray );
		})
		.on( 'error', err => {
			console.error( `error fetching media feature children or converting to JSON => ${ err }` );
			reject();
		});
};

exports.fetchMediaEligibilities = ( resolve, reject ) => {
	
	console.log( `fetching media eligibilities from CSV` );

	// fetch all records from the media eligibilities csv file
	csv().fromFile( mediaEligibilitiesFilePath )
		// wait until the whole file has been parsed into an array of objects
		.on( 'end_parsed', mediaEligibilitiesArray => {
			console.log( `media eligibilities fetched` );
			// resolve the promise with the array of disability objects
			resolve( mediaEligibilitiesArray );
		})
		.on( 'error', err => {
			console.error( `error fetching media eligibilities or converting to JSON => ${ err }` );
			reject();
		});
};

exports.fetchFamilies = ( resolve, reject ) => {
	
	console.log( `fetching families from CSV` );

	// fetch all records from the families csv file
	csv().fromFile( familiesFilePath )
		// wait until the whole file has been parsed into an array of objects
		.on( 'end_parsed', familiesArray => {
			console.log( `families fetched` );
			// resolve the promise with the array of disability objects
			resolve( familiesArray );
		})
		.on( 'error', err => {
			console.error( `error fetching families or converting to JSON => ${ err }` );
			reject();
		});
};

exports.fetchFamilyRacePreferences = ( resolve, reject ) => {
	
	console.log( `fetching family race preferences from CSV` );

	// fetch all records from the family race preferences csv file
	csv().fromFile( familyRacePreferencesFilePath )
		// wait until the whole file has been parsed into an array of objects
		.on( 'end_parsed', familyRacePreferencesArray => {
			console.log( `family race preferences fetched` );
			// resolve the promise with the array of disability objects
			resolve( familyRacePreferencesArray );
		})
		.on( 'error', err => {
			console.error( `error fetching family race preferences or converting to JSON => ${ err }` );
			reject();
		});
};

exports.fetchFamilyDisabilityPreferences = ( resolve, reject ) => {
	
	console.log( `fetching family disability preferences from CSV` );

	// fetch all records from the family disability preferences csv file
	csv().fromFile( familyDisabilityPreferencesFilePath )
		// wait until the whole file has been parsed into an array of objects
		.on( 'end_parsed', familyDisabilityPreferencesArray => {
			console.log( `family disability preferences fetched` );
			// resolve the promise with the array of family disability preference objects
			resolve( familyDisabilityPreferencesArray );
		})
		.on( 'error', err => {
			console.error( `error fetching family disability preferences or converting to JSON => ${ err }` );
			reject();
		});
};

exports.fetchFamilySupportServices = ( resolve, reject ) => {
	
	console.log( `fetching family support services from CSV` );

	// fetch all records from the family support services csv file
	csv().fromFile( familySupportServicesFilePath )
		// wait until the whole file has been parsed into an array of objects
		.on( 'end_parsed', familySupportServicesArray => {
			console.log( `family support services fetched` );
			// resolve the promise with the array of family disability preference objects
			resolve( familySupportServicesArray );
		})
		.on( 'error', err => {
			console.error( `error fetching family support services or converting to JSON => ${ err }` );
			reject();
		});
};