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
// create references to the maps that we stored on locals.  These are bound here to be available to multiple functions below since res can't be passed to the generator
let statesMap,
	regionsMap;

module.exports.importPlacements = ( req, res, done ) => {
	// expose the maps we'll need for this import
	statesMap	= res.locals.migration.maps.states;
	regionsMap	= res.locals.migration.maps.regions;
	// expose done to our generator
	placementsImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the placements CSV file to JSON
	const childrenLoaded = CSVConversionMiddleware.fetchChildren();

	// if the file was successfully converted, it will return the array of placements
	childrenLoaded
		.then( childrenArray => {
			// store the placements in a variable accessible throughout this file
			const filteredChildren = childrenArray.filter( child => {
				// if the child has any placement fields filled out, include them
				return child.placement_placed_date || child.placement_disruption_date || child.placement_fam_id ||
					child.placement_family_name || child.placement_address_1 || child.placement_address_2 ||
					child.placement_city || child.placement_state || child.placement_zip ||
					child.placement_home_phone || child.placement_country || child.placement_email ||
					child.placement_agency || child.placement_constellation || child.placement_rce_id;
			});

			placements = filteredChildren.map( child => {
				return {
					childId: child.chd_id,
					placedDate: child.placement_placed_date,
					disruptionDate: child.placement_disruption_date,
					familyId: child.placement_fam_id,
					familyName: child.placement_family_name,
					street1: child.placement_address_1,
					street2: child.placement_address_2,
					city: child.placement_city,
					state: child.placement_state,
					zipCode: child.placement_zip,
					homePhone: child.placement_home_phone,
					country: child.placement_country,
					email: child.placement_email,
					agencyId: child.placement_agency,
					familyConstellation: child.placement_constellation,
					raceId: child.placement_rce_id
				}
			});
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

	// fetch the child
	const childLoaded = utilityModelFetch.getChildByRegistrationNumber( placement.childId );
	// fetch the family
	const familyLoaded = utilityModelFetch.getFamilyByRegistrationNumber( placement.familyId );
	// fetch the agency
	const agencyLoaded = utilityModelFetch.getAgencyById( placement.agencyId )

	Promise.all( [ childLoaded, familyLoaded, agencyLoaded ] )
		.then( values => {

			const [ child, family, agency ] = values;

			let newPlacement = new Placement.model({

				placementDate				: placement.placedDate ? new Date( placement.placedDate ) : undefined,
				disruptionDate				: placement.disruptionDate ? new Date( placement.disruptionDate ) : undefined,
				familyAgency				: agency ? agency.get( '_id' ) : undefined,
				child						: child ? child.get( '_id' ) : undefined,
				isUnregisteredFamily		: !!placement.familyId,
				family						: family ? family.get( '_id' ) : undefined,
				familyDetails: {
					name: placement.familyName,	
					address: {
						street1: placement.street1,
						street2: placement.street2,
						city: placement.city,
						state: placement.state ? statesMap[ placement.state ] : undefined,
						zipCode: placement.zipCode,
						country: placement.country,
						region: placement.region ? regionsMap[ placement.region ] : undefined
					},
			
					phone: {
						home: placement.homePhone,
						preferred: 'home'
					},
			
					email: placement.email
				}
			});

			// save the new placement record
			newPlacement.save( ( err, savedModel ) => {
				// if we run into an error
				if( err ) {
					// store a reference to the entry that caused the error
					importErrors.push( { id: placement.childId, error: err } );
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
			importErrors.push( { id: placement.childId, error: `error importing placement for child - ${ err }` } );

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

// TODO:

	// 1. loop through children, grabbing the following and creating placement records

		// placement_placed_date
		// placement_disruption_date
		// placement_family_name
		// placement_address_1
		// placement_address_2
		// placement_city
		// placement_state
		// placement_zip
		// placement_home_phone
		// placement_country
		// placement_email
		// placement_agency
		// placement_constellation
		// placement_rce_id

	// 2. loop through all family_placement.csv and create placement records

	// 3. loop through all placements you've created to see if there are multiple placements for any child

	// 4. if no, append all placement sources

	// 5. if yes, freak out and talk to Lisa

	// PENDING. waiting for Victoria's response to find out how to handle a disruption for a child since we were using status change date for the placement date