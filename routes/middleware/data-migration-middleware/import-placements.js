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

	// if the file was successfully converted, it will return the array of placements
	placementsLoaded
		.then( placementsArray => {
			// store the placements in a variable accessible throughout this file
			const placements = placementsArray;
			// kick off the first run of our generator
			inquiryGenerator.next();
		// if there was an error converting the inquiries file
		}).catch( reason => {
			console.error( `error processing inquiries` );
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

		if( remainingRecords % 100 === 0 ) {
			console.log( `placements remaining: ${ remainingRecords }` );
		}
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

	Promise.all( [ childLoaded, familyLoaded ] )
		.then( values => {

			const [ child, family ] = values;

			let newPlacement = new Placement.model({

				placementDate: `no idea if this should be last updated date or not`,
				familyAgency: `will need to get the agency id from the family record`,
				// constellation: `meant for unregistered families, don't think we have this info`,
				// race: `meant for unregistered families, don't think we have this info`,
				// source: `done in placement_source import`,
				notes						: placement.comment,
				isUnregisteredChild			: !!child,
				child						: !!child ? child.get( '_id' ) : undefined,
				childDetails: {
					firstName				: !!child ? placement.chd_first_name : undefined,
					lastName				: !!child ? placement.chd_last_name : undefined,
					status					: `we don't have this info`
				},
				isUnregisteredFamily		: !family,
				family						: !!family ? family.get( '_id' ) : undefined,
				// placementDate			// this doesn't appear to exist in the old system
				childPlacedWithMAREFamily	: !!family,
				placedWithFamily			: family ? family.get( '_id' ) : undefined,
				
			});

			// save the new placement record
			newPlacement.save( ( err, savedModel ) => {
				// if we run into an error
				if( err ) {
					// store a reference to the entry that caused the error
					importErrors.push( { id: placement.fpl_id, error: err } );
				}

				// fire off the next iteration of our generator after pausing
				if( pauseUntilSaved ) {
					setTimeout( () => {
						placementGenerator.next();
					}, 1000 );
				}
			});
		})
		.catch( err => {
			// we can assume it was a reject from trying to fetch the city or town by an unrecognized name
			importErrors.push( { id: placement.fpl_id, error: `error importing placement with id ${ placement.fpl_id } - ${ err }` } );

			// fire off the next iteration of our generator after pausing for a second
			if( pauseUntilSaved ) {
				setTimeout( () => {
					placementGenerator.next();
				}, 1000 );
			}
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

// NEW NOTES:

		"fpl_id", // old id if using
		"fam_id", // family and all family details
		"chd_id", // child and all child details
		"chd_first_name", // child name if not in the system
		"chd_last_name", // child name if not in the system
		"status", // placement status | M = Matched, P = Placed, L = Legalized, N = Not Matched, D = Disruption
		"status_change_date", // possibly placementDate
		"comment" // notes
		
		// nothing matching source, race, or placement date unless we want to use status change date