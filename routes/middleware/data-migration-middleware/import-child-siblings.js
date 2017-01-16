const keystone				= require( 'keystone' );
const Child 				= keystone.list( 'Child' );
// utility middleware
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all children.  This is created here to be available to multiple functions below
let children;
// create an map to hold the sibling groups
let siblingGroups = {};
// expose done to be available to all functions below
let childSiblingsImportComplete;
// expose the array storing progress through the migration run
let migrationResults;

module.exports.appendSiblings = ( req, res, done ) => {
	// expose done to our generator
	childSiblingsImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the child CSV file to JSON
	const childrenLoaded = new Promise( ( resolve, reject ) => {
		// attempt to convert the children
		CSVConversionMiddleware.fetchChildren( resolve, reject );
	});
	// if the file was successfully converted, it will return the array of children
	childrenLoaded.then( childrenArray => {
		// store the children in a variable accessible throughout this file
		children = childrenArray;
		// call the function to build the sibling map
		exports.buildSiblingGroupMap();
		// kick off the first run of our generator
		siblingGenerator.next();
	// if there was an error converting the children file
	}).catch( reason => {
		console.error( `error processing children for appending siblings` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

module.exports.buildSiblingGroupMap = () => {
	// load all children
	for( let child of children ) {
		// for each child, get the sibling group id
		const siblingGroupId = child.sibling_group_id;
	 	// and use the id as a key, and add each child’s _id in a key object
		if( siblingGroupId ) {

			const registrationNumber = parseInt( child.chd_id, 10 );

			if( siblingGroups[ siblingGroupId ] ) {
				// add the registration number for the current child
				siblingGroups[ siblingGroupId ].push( registrationNumber );
			} else {
				let siblingArray = [ registrationNumber ];
				// create an entry containing a set with the one child's registration number
				siblingGroups[ siblingGroupId ] = siblingArray;
			}
		}
	}
};

/* a generator to allow us to control the processing of each record */
module.exports.generateSiblings = function* generateSiblings() {

	console.log( `appending siblings to children in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords			= Object.keys( siblingGroups ).length,
		remainingRecords 		= totalRecords,
		batchCount				= 100, // number of records to be process simultaneously
		siblingGroupNumber		= 0; // keeps track of the current child number being processed.  Used for batch processing
	// loop through each child object we need to append to each record
	for( let key in siblingGroups ) {
		// increment the siblingGroupNumber
		siblingGroupNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( siblingGroupNumber % batchCount === 0 ) {
			yield exports.updateChildRecord( siblingGroups[ key ], true );
		} else {
			exports.updateChildRecord( siblingGroups[ key ], false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `sibling groups remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			const resultsMessage = `finished appending ${ totalRecords } sibling groups to children in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Siblings',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return childSiblingsImportComplete();
		}
	}
};

// a function paired with the generator to append data to a record and request the generator to process the next once finished
module.exports.updateChildRecord = ( ids, pauseUntilSaved ) => {

	const [ childRegistrationNumber, ...siblingRegistrationNumbers ] = ids;
	// promise fetch first child
	// create a promise for converting the child CSV file to JSON
	const childLoaded = new Promise( ( resolve, reject ) => {
		// attempt to convert the children
		utilityModelFetch.getChildByRegistrationNumber( resolve, reject, childRegistrationNumber );
	});
	// promise fetch _ids from other children
	const siblingsLoaded = new Promise( ( resolve, reject ) => {
		// attempt to convert the children
		utilityModelFetch.getChildIdsByRegistrationNumbers( resolve, reject, siblingRegistrationNumbers );
	});
	// when both resolve
	Promise.all( [ childLoaded, siblingsLoaded ] ).then( children => {

		const [ child, siblingIds ] = children;
		// append other ids to first child
		child.siblings = siblingIds
		// save first child
		child.save( ( err, savedModel ) => {
			// if we run into an error
			if( err ) {
				// halt execution by throwing an error
				console.log( `error: ${ err }` );
				throw `[registration number: ${ child.registrationNumber }] an error occured while saving ${ child.name.full }.`;
			}

			// fire off the next iteration of our generator after pausing
			if( pauseUntilSaved ) {
				setTimeout( () => {
					siblingGenerator.next();
				}, 2000 );
			}
		});
	});
};

// instantiates the generator used to create child records at a regulated rate
const siblingGenerator = exports.generateSiblings();