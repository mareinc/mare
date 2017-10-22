/* IMPORTANT NOTE: THIS FILE IS NOT COMPLETE, AND WAS CHECKED IN AS A PARTIAL IMPLEMENTATION
 * 
 * NOTE: still trying to figure out how to match specific placements with placement sources.  It appears
 * 		 placement sources are linked to children, but not placements, and placements are linked to children
 * 		 and are missing placement sources
 */

const keystone					= require( 'keystone' );
const Placement 				= keystone.list( 'Placement' );
// utility middleware
const utilityFunctions			= require( './utilities_functions' );
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all placements.  These are created here to be available to multiple functions below
let placements;
// expose done to be available to all functions below
let placementsImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.importPlacements = ( req, res, done ) => {
	// expose done to our generator
	placementsImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the placements CSV file to JSON
	const placementsLoaded = CSVConversionMiddleware.fetchPlacements();
	// create a promise for converting the placement source CSV file to JSON
	const placementSourcesLoaded = CSVConversionMiddleware.fetchPlacementSources();

	// TODO: need to load recruitment sources

	// TODO: in the main part, need to fetch the child by old id
	// TODO: in the main part, need to fetch the family by old id

	// if the file was successfully converted, it will return the array of placements
	Promise.all( [ placementsLoaded, placementSourcesLoaded ] ).then( values => {
		// store the retrieved placements and placement sources in local variables
		const [ placementsArray, placementSourcesArray ] = values;

		const placements = new Map()

		for( let placement of placementsArray ) {
			if( placements.has( placement.chd_id ) ) {
				placements.get( placement.chd_id ).placements.push( placement );
			} else {
				placements.set( placement.chd_id, { sources: [], placements: [ placement ] } );
			}
		}

		for( let placementSource of placementSourcesArray ) {
			if( placements.has( placementSource.chd_id ) ) {
				placements.get( placementSource.chd_id ).sources.push( placementSource );
			} else {
				placements.set( placementSource.chd_id, { sources: [ placementSource ], placements: [] } );
			}
		}

		let badCount = 0;

		for( let [ key, placement ] of placements ) {
			if( placement.sources.length !== placement.placements.length ) {
				console.log( `${ key } - sources: ${ placement.sources.length }, placements: ${ placement.placements.length }` );
				badCount++;
			}
		}
		console.log( `${ badCount } entries with number of sources and placements that don't match` );
		// kick off the first run of our generator
		// placementGenerator.next();
		var x = 10;
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

			console.log( `the following records weren't saved correctly:` );

			importErrors.forEach( error => {
				console.log( error )
			});

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

	// fetch the child
	const childLoaded = utilityModelFetch.getChildByRegistrationNumber( placement.chd_id );
	// fetch the family
	const familyLoaded = utilityModelFetch.getFamilyByRegistrationNumber( placement.fam_id );

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
				// store a reference to the entry that caused the error
				importErrors.push( { id: placement.fpl_id, error: err.err } );
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