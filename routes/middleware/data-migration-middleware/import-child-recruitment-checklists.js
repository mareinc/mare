const keystone					= require( 'keystone' );
const Family 					= keystone.list( 'Family' );
// utility middleware
const utilityFunctions			= require( './utilities_functions' );
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all recruitment checklists.  This is created here to be available to multiple functions below
let recruitmentChecklistItems;
// create an object to hold the child recruitment checklists
let newChildRecruitmentChecklistItemsMap = {};
// expose done to be available to all functions below
let childRecruitmentChecklistItemsImportComplete;
// expose the array storing progress through the migration run
let migrationResults;

module.exports.appendChildRecruitmentChecklistItems = ( req, res, done ) => {
	// expose done to our generator
	childRecruitmentChecklistItemsImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the recruitment checklists CSV file to JSON
	const recruitmentChecklistItemsLoaded = new Promise( ( resolve, reject ) => {
		// attempt to convert the recruitment checklists
		CSVConversionMiddleware.fetchRecruitmentChecklistItems( resolve, reject );
	});
	// if the file was successfully converted, it will return the array of recruitment checklists
	recruitmentChecklistItemsLoaded.then( recruitmentChecklistItemsArray => {
		// store the recruitment checklists in a variable accessible throughout this file
		recruitmentChecklistItems = recruitmentChecklistItemsArray;
		// call the function to build the recruitment checklists map
		exports.buildChildRecruitmentChecklistItemsMap();
		// kick off the first run of our generator
		childRecruitmentChecklistItemsGenerator.next();
	// if there was an error converting the recruitment checklists file
	}).catch( reason => {
		console.error( `error processing recruitment checklists` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

module.exports.buildChildRecruitmentChecklistItemsMap = () => {

	// load all child recruitment checklists
	for( let recruitmentChecklistItem of recruitmentChecklistItems ) {
		// for each child recruitment checklists get the family id
		const childId = recruitmentChecklistItem.chd_id;
	 	// and use the id as a key, and add each support service's _id in a key object
		if( childId ) {

			childRecruitmentChecklistItems = {
				action: recruitmentChecklistItem.rca_id,
				comments: recruitmentChecklistItem.comments
			};

			if( newChildRecruitmentChecklistItemsMap[ childId ] ) {

					newChildRecruitmentChecklistItemsMap[ childId ].add( childRecruitmentChecklistItems );

			} else {

				let newChildSet = new Set( [ childRecruitmentChecklistItems ] );
				// create an entry containing a set with the one support service
				newChildRecruitmentChecklistItemsMap[ childId ] = newChildSet;
			}
		}
	}
};

/* a generator to allow us to control the processing of each record */
module.exports.generateChildRecruitmentChecklistItems = function* generateChildRecruitmentChecklistItems() {
	
	console.log( `creating child recruitment checklists in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords					= Object.keys( newChildRecruitmentChecklistItemsMap ).length,
		remainingRecords 			    = totalRecords,
		batchCount					    = 100, // number of records to be process simultaneously
		childRecruitmentChecklistNumber	= 0; // keeps track of the current child recruitment checklists number being processed.  Used for batch processing
	// loop through each child recruitment checklist object we need to create a record for
	for( let key in newChildRecruitmentChecklistItemsMap ) {
		// increment the childRecruitmentChecklistNumber
		childRecruitmentChecklistNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( childRecruitmentChecklistNumber % batchCount === 0 ) {
			yield exports.updateChildRecord( newChildRecruitmentChecklistItemsMap[ key ], key, true );
		} else {
			exports.updateChildRecord( newChildRecruitmentChecklistItemsMap[ key ], key, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `child recruitment checklists remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			const resultsMessage = `finished appending ${ totalRecords } child recruitment checklists in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Child Recruitment Checklists',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return childRecruitmentChecklistItemsImportComplete();
		}
	}
};

// a function paired with the generator to create a record and request the generator to process the next once finished
module.exports.updateChildRecord = ( recruitmentChecklistItems, childRegistrationNumber, pauseUntilSaved ) => {

	const recruitmentChecklistItemsArray = Array.from( recruitmentChecklistItems );

	// create a promise
	const childLoaded = new Promise( ( resolve, reject ) => {
		// for fetching the child
		utilityModelFetch.getChildByRegistrationNumber( resolve, reject, childRegistrationNumber );
	});

	childLoaded.then( child => {
		// create an array from the recruitment checklist actions associated with the current child
		const recruitmentActionsArray = recruitmentChecklistItemsArray.map( recruitmentChecklistItem => {
			return recruitmentChecklistItem.action;
		});

		// child.field = recruitmentActionsArray.indexOf( someNumber ) ? true : false;
		// child.fieldComments = recruitmentActionsArray.indexOf( someNumber ) ? recruitmentChecklistItemsArray[ recruitmentActionsArray.indexOf( someNumber ) ].comments : '';

		// save the updated child record
		child.save( ( err, savedModel ) => {
			// if we run into an error
			if( err ) {
				console.log( `registration number: ${ child.registrationNumber }` );
				// halt execution by throwing an error
				console.log( `error: ${ err }` );
				throw `[registration number: ${ child.get( 'registrationNumber' ) }] an error occured while appending a recruitment checklist group to the child record.`;
			}

			// fire off the next iteration of our generator after pausing
			if( pauseUntilSaved ) {
				childRecruitmentChecklistItemsGenerator.next();
			}
		});
	});
};

// instantiates the generator used to create family records at a regulated rate
const childRecruitmentChecklistItemsGenerator = exports.generateChildRecruitmentChecklistItems();