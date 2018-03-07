const keystone					= require( 'keystone' );
const Match						= keystone.list( 'Match' );
const Placement 				= keystone.list( 'Placement' );
const Disruption 				= keystone.list( 'Disruption' );
const Legalization 				= keystone.list( 'Legalization' );
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
// create references to the maps that we stored on locals.  These are bound here to be available to multiple functions below since res can't be passed to the generator
let childStatusesMap;

module.exports.importPlacements = ( req, res, done ) => {
	// expose the maps we'll need for this import
	childStatusesMap = res.locals.migration.maps.childStatuses;
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
			placements = placementsArray;
			// kick off the first run of our generator
			placementGenerator.next();
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
	
	console.log( `placements remaining: ${ remainingRecords }` );
	
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

	// placeholders to store the fetched child and family records
	let child,
		family;
	// fetch the child
	const childLoaded = utilityModelFetch.getChildByRegistrationNumber( placement.chd_id );
	// fetch the family
	const familyLoaded = utilityModelFetch.getFamilyByRegistrationNumber( placement.fam_id );

	Promise.all( [ childLoaded, familyLoaded ] )
		// if the child and family were fetched, store them in variables for later use
		.then( values => [ child, family ] = values )
		// if there was an error fetching the child or family, store the error
		.catch( err => importErrors.push( { id: placement.fpl_id, error: `error importing placement with id ${ placement.fpl_id } - error loading family or child - ${ err }` } ) )
		// fetch any existing placements for the child
		.then( () => utilityModelFetch.getPlacementsByChildId( child ? child.get( '_id' ) : undefined ) )
		// if existing placements were fetched successfully
		.then( existingPlacements => {

			let newPlacement;
			
			if( placement.status === 'P' ) {

				const duplicatePlacements = existingPlacements.filter( existingPlacement => {
						// if a placement in the system has the same date, family, and child, it's a duplicate and we should abort creating the current placement
						return existingPlacement.placementDate &&
							   placement.status_change_date &&
							   existingPlacement.placementDate.toString() === ( new Date( placement.status_change_date ) ).toString() &&
							   existingPlacement.child &&
							   child &&
							   existingPlacement.child.toString() === child.get( '_id' ).toString() &&
							   existingPlacement.family &&
							   family &&
							   existingPlacement.family.toString() === family.get( '_id' ).toString();
					});

				if( duplicatePlacements.length > 0 ) {
					// fire off the next iteration of our generator after pausing
					if( pauseUntilSaved ) {
						setTimeout( () => {
							return placementGenerator.next();
						}, 1000 );
					} else {
						return;
					}
				}

				newPlacement = new Placement.model({
					
					placementDate		: placement.status_change_date ? new Date( placement.status_change_date ) : undefined,
					familyDetails: {
						agency: family ? family.get( 'agency' ) : undefined
					},
					notes				: placement.comment,
					isUnregisteredChild	: !child,
					child				: child ? child.get( '_id' ) : undefined,
					childDetails: {
						firstName		: !child ? placement.chd_first_name : undefined,
						lastName		: !child ? placement.chd_last_name : undefined,
						status			: !child ? childStatusesMap[ placement.status ] : undefined
					},
					isUnregisteredFamily: !family,
					family				: family ? family.get( '_id' ) : undefined	
				});

			} else if( placement.status === 'L' ) {

				newPlacement = new Legalization.model({
					
					legalizationDate	: placement.status_change_date ? new Date( placement.status_change_date ) : undefined,
					familyDetails: {
						agency: family ? family.get( 'agency' ) : undefined
					},
					notes				: placement.comment,
					isUnregisteredChild	: !child,
					child				: child ? child.get( '_id' ) : undefined,
					childDetails: {
						firstName		: !child ? placement.chd_first_name : undefined,
						lastName		: !child ? placement.chd_last_name : undefined,
						status			: !child ? childStatusesMap[ placement.status ] : undefined
					},
					isUnregisteredFamily: !family,
					family				: family ? family.get( '_id' ) : undefined	
				});

			} else if( placement.status === 'D' ) {

				newPlacement = new Disruption.model({
					
					disruptionDate		: placement.status_change_date ? new Date( placement.status_change_date ) : undefined,
					familyDetails: {
						agency: family ? family.get( 'agency' ) : undefined
					},
					notes				: placement.comment,
					isUnregisteredChild	: !child,
					child				: child ? child.get( '_id' ) : undefined,
					childDetails: {
						firstName		: !child ? placement.chd_first_name : undefined,
						lastName		: !child ? placement.chd_last_name : undefined,
						status			: !child ? childStatusesMap[ placement.status ] : undefined
					},
					isUnregisteredFamily: !family,
					family				: family ? family.get( '_id' ) : undefined	
				});

			} else if( [ 'M', 'N' ].includes( placement.status ) ) {

				newPlacement = new Match.model({
					
					matchDate			: placement.status_change_date ? new Date( placement.status_change_date ) : undefined,
					status				: placement.status === 'M' ? 'matched' :
										  placement.status === 'N' ? 'not matched' :
										  undefiend,
					familyDetails: {
						agency: family ? family.get( 'agency' ) : undefined
					},
					notes				: placement.comment,
					isUnregisteredChild	: !child,
					child				: child ? child.get( '_id' ) : undefined,
					childDetails: {
						firstName		: !child ? placement.chd_first_name : undefined,
						lastName		: !child ? placement.chd_last_name : undefined,
						status			: !child ? childStatusesMap[ placement.status ] : undefined
					},
					isUnregisteredFamily: !family,
					family				: family ? family.get( '_id' ) : undefined	
				});
			}

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
		// if existing placements were fetched successfully
		.catch( err => {
			// we can assume it was a reject from trying to fetch the city or town by an unrecognized name
			importErrors.push( { id: placement.fpl_id, error: `error importing placement with id ${ placement.fpl_id } - error fetching existing placements - ${ err }` } );

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