const keystone					= require( 'keystone' );
const Family 					= keystone.list( 'Family' );
// utility middleware
const utilityFunctions			= require( './utilities_functions' );
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all family children.  This is created here to be available to multiple functions below
let familyChildren;
// create references to the maps that we stored on locals.  These are bound here to be available to multiple functions below since res can't be passed to the generator
let childTypesMap;
// create an object to hold the family children
let newFamilyChildrenMap = {};
// expose done to be available to all functions below
let familyChildrenImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.appendFamilyChildren = ( req, res, done ) => {
	// expose the maps we'll need for this import
	childTypesMap = res.locals.migration.maps.childTypes;
	// expose done to our generator
	familyChildrenImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the family children CSV file to JSON
	const familyChildrenLoaded = new Promise( ( resolve, reject ) => {
		// attempt to convert the family children
		CSVConversionMiddleware.fetchFamilyChildren( resolve, reject );
	});
	// if the file was successfully converted, it will return the array of family children
	familyChildrenLoaded.then( familyChildrenArray => {
		// store the family children in a variable accessible throughout this file
		familyChildren = familyChildrenArray;
		// call the function to build the family children map
		exports.buildChildrenMap();
		// kick off the first run of our generator
		familyChildrenGenerator.next();
	// if there was an error converting the family children file
	}).catch( reason => {
		console.error( `error processing family children` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

module.exports.buildChildrenMap = () => {

	// load all family children
	for( let familyChild of familyChildren ) {
		// for each family children get the family id
		const familyId = familyChild.fam_id;
	 	// and use the id as a key, and add each support service's _id in a key object
		if( familyId ) {

			if( newFamilyChildrenMap[ familyId ] ) {

					newFamilyChildrenMap[ familyId ].add( familyChild );

			} else {

				let newChildSet = new Set( [ familyChild ] );
				// create an entry containing a set with the one support service
				newFamilyChildrenMap[ familyId ] = newChildSet;
			}
		}
	}
};

/* a generator to allow us to control the processing of each record */
module.exports.generateFamilyChildren = function* generateFamilyChildren() {
	
	console.log( `creating family children in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords				= Object.keys( newFamilyChildrenMap ).length,

		remainingRecords 			= totalRecords,
		batchCount					= 100, // number of records to be process simultaneously
		familyChildrenGroupNumber	= 0; // keeps track of the current family children group number being processed.  Used for batch processing
	// loop through each family children group object we need to create a record for
	for( let key in newFamilyChildrenMap ) {
		// increment the familyChildrenGroupNumber
		familyChildrenGroupNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( familyChildrenGroupNumber % batchCount === 0 ) {
			yield exports.updateFamilyRecord( newFamilyChildrenMap[ key ], key, true );
		} else {
			exports.updateFamilyRecord( newFamilyChildrenMap[ key ], key, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `family children groups remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			const resultsMessage = `finished appending ${ totalRecords } family children groups in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Family Children',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return familyChildrenImportComplete();
		}
	}
};

// a function paired with the generator to create a record and request the generator to process the next once finished
module.exports.updateFamilyRecord = ( children, familyId, pauseUntilSaved ) => {

	const childrenArray = Array.from( children );

	// create a promise
	const familyLoaded = new Promise( ( resolve, reject ) => {
		// for fetching the family
		utilityModelFetch.getFamilyByRegistrationNumber( resolve, reject, familyId );
	});

	familyLoaded.then( family => {
		// keep track of the current child we're adding to the family
		let childNumber = 1;

		for( let child of childrenArray ) {
			// the system can only catalogue 8 children, ignore any children beyond that point
			if( childNumber > 8 ) {
				continue;
			}
			// get the object for the current child on the family model
			const targetChild = family[ `child${ childNumber }` ];
			// set the relevant child fields, note that gender is missing
			targetChild.name = child.name;
			targetChild.birthDate = child.date_of_birth ? new Date( child.date_of_birth ) : undefined;
			targetChild.type = childTypesMap[ child.type ];
			// up the childNumber for the next iteration of the loop
			childNumber++;
		}
		// the system can only register 1, 2, 3, 4, 5, 6, 7, and 8+
		family.numberOfChildren = childrenArray.length <= 7 ? childrenArray.length : '8+';

		// save the updated family record
		family.save( ( err, savedModel ) => {
			// if we run into an error
			if( err ) {
				console.log( `registration number: ${ family.registrationNumber }` );
				// halt execution by throwing an error
				console.log( `error: ${ err }` );
				throw `[registration number: ${ family.get( 'registrationNumber' ) }] an error occured while appending a children group to the family record.`;
			}

			// fire off the next iteration of our generator after pausing
			if( pauseUntilSaved ) {
				familyChildrenGenerator.next();
			}
		});
	});
};

// instantiates the generator used to create family records at a regulated rate
const familyChildrenGenerator = exports.generateFamilyChildren();