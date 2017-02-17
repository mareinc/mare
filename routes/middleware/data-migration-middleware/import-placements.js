const keystone					= require( 'keystone' );
const Placement 				= keystone.list( 'Placement' );
// utility middleware
const utilityFunctions			= require( './utilities_functions' );
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all placements.  This is created here to be available to multiple functions below
let placements;
// expose done to be available to all functions below
let importPlacementsComplete;
// expose the array storing progress through the migration run
let migrationResults;

module.exports.importPlacements = ( req, res, done ) => {
	// expose done to our generator
	importPlacementsComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the placements CSV file to JSON
	const placementsLoaded = new Promise( ( resolve, reject ) => {
		// attempt to convert the placements
		CSVConversionMiddleware.fetchPlacements( resolve, reject );
	});
	// if the file was successfully converted, it will return the array of placements
	placementsLoaded.then( placementsArray => {
		// store the placements in a variable accessible throughout this file
		placements = placementsArray;
		// kick off the first run of our generator
		placementGenerator.next();
	// if there was an error converting the placements file
	}).catch( reason => {
		console.error( `error processing placements` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

/* a generator to allow us to control the processing of each record */
module.exports.generatePlacements = function* generatePlacements() {
	
	console.log( `creating placements in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords		= placements.length,

		remainingRecords 	= totalRecords,
		batchCount			= 100, // number of records to be process simultaneously
		placementsNumber	= 0; // keeps track of the current placement being processed.  Used for batch processing
	// loop through each placement we need to create a record for
	for( let placement of placements ) {
		// increment the placementsNumber
		placementsNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( placementsNumber % batchCount === 0 ) {
			yield exports.createPlacementRecord( placement, true );
		} else {
			exports.createPlacementRecord( placement, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `placements remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			const resultsMessage = `finished creating ${ totalRecords } placements in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Placements',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return placementsImportComplete();
		}
	}
};

// a function paired with the generator to create a record and request the generator to process the next once finished
module.exports.createPlacementRecord = ( placement, pauseUntilSaved ) => {

	// create a promise for fetching the child
	const childLoaded = new Promise( ( resolve, reject ) => {
		// if the placement doesn't have a child listed
		if( !placement.chd_id ) {
			// resolve the promise on the spot
			resolve();
		// otherwise, use the child id to fetch their record in the new system
		} else {
			utilityModelFetch.getChildByRegistrationNumber( resolve, reject, placement.chd_id );
		}
	});
	// create a promise for fetching the family
	const familyLoaded = new Promise( ( resolve, reject ) => {
		// if the placement doesn't have a family listed
		if ( !placement.fam_id ) {
			// resolve the promise on the spot
			resolve();
		// otherwise, use the family id to fetch their record in the new system
		} else {
			// for fetching the _ids from other children
			utilityModelFetch.getFamilyByRegistrationNumber( resolve, reject, placement.fam_id );
		}
	});

	Promise.all( [ childLoaded, familyLoaded ] ).then( values => {

		const [ child, family ] = values;

		let newPlacement = new Placement.model({

			// oldId: placement.fpl_id,
			child						: child ? child.get( '_id' ) : undefined,
			// placementDate			// this doesn't appear to exist in the old system
			childPlacedWithMAREFamily	: !!family,
			placedWithFamily			: family ? family.get( '_id' ) : undefined,
			// familyAgency				// needs to be determined on save
			notes						: placement.comment
		});

		// save the new placement record
		newPlacement.save( ( err, savedModel ) => {
			// if we run into an error
			if( err ) {
				// halt execution by throwing an error
				console.log( `error: ${ err }` );
				throw `[placement id: ${ placement.fpl_id }] an error occured while creating a placement.`;
			}

			// fire off the next iteration of our generator after pausing
			if( pauseUntilSaved ) {
				setTimeout( () => {
					placementGenerator.next();
				}, 1000 );
			}
		});
	});
};

// instantiates the generator used to create family records at a regulated rate
const placementGenerator = exports.generatePlacements();

	// MODEL FIELDS:

		// placementDate				Date
		// * child						Relationship
		// * childPlacedWithMAREFamily	Boolean
		// * placedWithFamily			Relationship
		// * familyAgency				Relationship // needs to be determined on save
		// source						Relationship // added in the placement source import
		// * notes						Textarea


	// MATCHED FIELDS ( SOME NEED TO AUTO-GENERATE AS NOTED ABOVE ):

		// placementOldId		fpl_id
		// placedWithFamily		fam_id
		// child				chd_id
		// comment				notes


	// QUESTIONS FOR LISA:

		// we have no status ( just a place to mark disruptions ).  Should I only carry over the status and the date from placements marked as disrupted?
			// options from the old system: M = Matched, P = Placed, L = Legalized, N = Not Matched, D = Disruption

		// we have no place to enter child information, and some records we're bringing over don't have a child id, but do have a child first / last name

		// we have no placement date, do placements in the old system have a date associated with them?