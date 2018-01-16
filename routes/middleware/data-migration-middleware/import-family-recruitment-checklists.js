const keystone					= require( 'keystone' );
const Family 					= keystone.list( 'Family' );
// utility middleware
const utilityFunctions			= require( './utilities_functions' );
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all recruitment checklists.  This is created here to be available to multiple functions below
let recruitmentChecklistItems;
// create an object to hold the family recruitment checklists
let newFamilyRecruitmentChecklistItemsMap = {};
// expose done to be available to all functions below
let familyRecruitmentChecklistItemsImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.appendFamilyRecruitmentChecklistItems = ( req, res, done ) => {
	// expose done to our generator
	familyRecruitmentChecklistItemsImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the recruitment checklists CSV file to JSON
	const recruitmentChecklistItemsLoaded = CSVConversionMiddleware.fetchRecruitmentChecklistItems();

	// if the file was successfully converted, it will return the array of recruitment checklists
	recruitmentChecklistItemsLoaded.then( recruitmentChecklistItemsArray => {
		// store the recruitment checklists in a variable accessible throughout this file
		recruitmentChecklistItems = recruitmentChecklistItemsArray;
		// call the function to build the recruitment checklists map
		exports.buildFamilyRecruitmentChecklistItemsMap();
		// kick off the first run of our generator
		familyRecruitmentChecklistItemsGenerator.next();
	// if there was an error converting the recruitment checklists file
	}).catch( reason => {
		console.error( `error processing recruitment checklists` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

module.exports.buildFamilyRecruitmentChecklistItemsMap = () => {

	// load all family recruitment checklists
	for( let recruitmentChecklistItem of recruitmentChecklistItems ) {
		// for each family recruitment checklists get the family id
		const familyId = recruitmentChecklistItem.fam_id;
	 	// and use the id as a key, and add each support service's _id in a key object
		if( familyId ) {

			familyRecruitmentChecklistItems = {
				action: recruitmentChecklistItem.rca_id,
				comments: recruitmentChecklistItem.comments
			};

			if( newFamilyRecruitmentChecklistItemsMap[ familyId ] ) {

					newFamilyRecruitmentChecklistItemsMap[ familyId ].add( familyRecruitmentChecklistItems );

			} else {

				let newFamilySet = new Set( [ familyRecruitmentChecklistItems ] );
				// create an entry containing a set with the one support service
				newFamilyRecruitmentChecklistItemsMap[ familyId ] = newFamilySet;
			}
		}
	}
};

/* a generator to allow us to control the processing of each record */
module.exports.generateFamilyRecruitmentChecklistItems = function* generateFamilyRecruitmentChecklistItems() {
	
	console.log( `creating family recruitment checklists in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords				= Object.keys( newFamilyRecruitmentChecklistItemsMap ).length,

		remainingRecords 			        = totalRecords,
		batchCount					        = 100, // number of records to be process simultaneously
		familyRecruitmentChecklistNumber	= 0; // keeps track of the current family recruitment checklists number being processed.  Used for batch processing
	// loop through each family recruitment checklist object we need to create a record for
	for( let key in newFamilyRecruitmentChecklistItemsMap ) {
		// increment the familyRecruitmentChecklistNumber
		familyRecruitmentChecklistNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( familyRecruitmentChecklistNumber % batchCount === 0 ) {
			yield exports.updateFamilyRecord( newFamilyRecruitmentChecklistItemsMap[ key ], key, true );
		} else {
			exports.updateFamilyRecord( newFamilyRecruitmentChecklistItemsMap[ key ], key, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `family recruitment checklists remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			console.log( `the following records weren't saved correctly:` );

			importErrors.forEach( error => {
				console.log( error )
			});

			const resultsMessage = `finished appending ${ totalRecords } family recruitment checklists in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Family Recruitment Checklists',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return familyRecruitmentChecklistItemsImportComplete();
		}
	}
};

// a function paired with the generator to create a record and request the generator to process the next once finished
module.exports.updateFamilyRecord = ( recruitmentChecklistItems, familyRegistrationNumber, pauseUntilSaved ) => {

	const recruitmentChecklistItemsArray = Array.from( recruitmentChecklistItems );

	// fetch the family
	const familyLoaded = utilityModelFetch.getFamilyByRegistrationNumber( familyRegistrationNumber );

	familyLoaded
		.then( family => {
			// create an array from the recruitment checklist actions associated with the current family
			const recruitmentActionsArray = recruitmentChecklistItemsArray.map( recruitmentChecklistItem => {
				return recruitmentChecklistItem.action;
			});

			// family.field = recruitmentActionsArray.indexOf( someNumber ) ? true : false;
			// family.fieldComments = recruitmentActionsArray.indexOf( someNumber ) ? recruitmentChecklistItemsArray[ recruitmentActionsArray.indexOf( someNumber ) ].comments : '';

			// save the updated family record
			family.save( ( err, savedModel ) => {
				// if we run into an error
				if( err ) {
					// store a reference to the entry that caused the error
					importErrors.push( { id: family.get( 'registrationNumber' ), error: err.err } );
				}

				// fire off the next iteration of our generator after pausing
				if( pauseUntilSaved ) {
					familyRecruitmentChecklistItemsGenerator.next();
				}
			});
		})
		.catch( err => {
			importErrors.push( { id: familyId, err: `error adding recruitment checklist items ${ recruitmentChecklistItems } to family with id ${ familyRegistrationNumber } - ${ err }` } );

			// fire off the next iteration of our generator after pausing
			if( pauseUntilSaved ) {
				setTimeout( () => {
					familyRacePreferenceGenerator.next();
				}, 1000 );
			}
		});
};

// instantiates the generator used to create family records at a regulated rate
const familyRecruitmentChecklistItemsGenerator = exports.generateFamilyRecruitmentChecklists();