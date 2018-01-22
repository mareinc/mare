const keystone					= require( 'keystone' );
const Agency 					= keystone.list( 'Agency' );
// utility middleware
const utilityFunctions			= require( './utilities_functions' );
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all agencies.  This is created here to be available to multiple functions below
let agencies;
// create references to the maps that we stored on locals.  These are bound here to be available to multiple functions below since res can't be passed to the generator
let statesMap,
	regionsMap;
// expose done to be available to all functions below
let agencyImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];
// create a set to store problems with unrecognized city or town names.  A set is used to capture unique values
let cityOrTownNameError = new Set();

module.exports.importAgencies = ( req, res, done ) => {
	// expose the maps we'll need for this import
	statesMap	= res.locals.migration.maps.states;
	regionsMap	= res.locals.migration.maps.regions;
	// expose done to our generator
	agencyImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the agencies CSV file to JSON
	const agenciesLoaded = CSVConversionMiddleware.fetchAgencies();

	// if the file was successfully converted, it will return the array of agencies
	agenciesLoaded.then( agenciesArray => {
		// store the agencies in a variable accessible throughout this file
		agencies = agenciesArray;
		// kick off the first run of our generator
		agencyGenerator.next();
	// if there was an error converting the agencies file
	}).catch( reason => {
		console.error( `error processing agencies` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

/* a generator to allow us to control the processing of each record */
module.exports.generateAgencies = function* generateAgencies() {

	console.log( `creating agencies in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords		= agencies.length,
		remainingRecords 	= totalRecords,
		batchCount			= 100, // number of records to be process simultaneously
		agencyNumber		= 0; // keeps track of the current agency number being processed.  Used for batch processing
	// loop through each agency object we need to create a record for
	for( let agency of agencies ) {
		// increment the agencyNumber
		agencyNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( agencyNumber % batchCount === 0 ) {
			yield exports.createAgencyRecord( agency, true );
		} else {
			exports.createAgencyRecord( agency, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `agencies remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			console.log( `the following records weren't saved correctly:` );

			importErrors.forEach( error => {
				console.error( error )
			});

			cityOrTownNameError.forEach( cityOrTown => {
				console.error( `bad city: ${ cityOrTown }` );
			});

			const resultsMessage = `finished creating ${ totalRecords } agencies in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Agencies',
				results: resultsMessage
			});
			
			console.log( resultsMessage );
			// return control to the data migration view
			return agencyImportComplete();
		}
	}
};

/* the import function for agencies */
module.exports.createAgencyRecord = ( agency, pauseUntilSaved ) => {		
	// 1002 maps to "other" and 1007 maps to "out of state"
	let region = regionsMap[ agency.rgn_id ] ? regionsMap[ agency.rgn_id ] : // if the region is an expected value, use the id from the old system to get the id in the new system
					agency.state === 'MA' ?	regionsMap[ 1002 ] : // otherwise, if the state is Massachusetts, set the region to 'other'
					regionsMap[ 1007 ]; // if the state is not Massachusetts, set the region to 'out of state'

	// agency codes need to be prefixed by the state, then a dash
	let code = agency.code.startsWith( agency.state ) ? agency.code.replace( agency.state, `${ agency.state }-` ) :
			   `${ agency.state }-${ agency.code }`;
	 
	// adjust cities / towns in MA to have names the system expects so it can find their records
	switch( agency.city ) {
		case `South Boston`: agency.city = `Dorchester`; break;
		case `W. Springfield`: agency.city = `Springfield`; break;
		case `West Newton`: agency.city = `Newton`; break;
		case `East Taunton`: agency.city = `Taunton`; break;
		case `Foxboro`: agency.city = `Foxborough`; break;
		case `South Dennis`: agency.city = `Dennis`; break;
	}
	// create a promise for fetching the MA city or town associated with the agency
	const cityOrTownLoaded = utilityModelFetch.getCityOrTownByName( agency.city.trim(), agency.state );
	// once we've fetch the city or town
	cityOrTownLoaded
		.then( cityOrTown => {
			let newAgency = new Agency.model({

				oldId: agency.agn_id,
				code: code ? code.trim() : undefined,
				name: agency.name ? agency.name.trim() : undefined,

				phone: agency.phone ? agency.phone.trim() : undefined,
				fax: agency.fax ? agency.fax.trim() : undefined,

				address: {
					street1: agency.address_1 ? agency.address_1.trim() : undefined,
					street2: agency.address_2 ? agency.address_2.trim() : undefined,
					isOutsideMassachusetts: agency.state !== 'MA',
					city: cityOrTown,
					cityText: agency.state !== 'MA' ? agency.city.trim() : undefined,
					state: statesMap[ agency.state ] || statesMap[ 'I' ],
					zipCode: utilityFunctions.padZipCode( agency.zip ),
					region: region
				},

				url: agency.url ? agency.url.trim() : undefined
			});

			newAgency.save( ( err, savedModel ) => {
				// if we run into an error
				if( err ) {
					// store a reference to the entry that caused the error
					importErrors.push( { id: agency.agn_id, error: err } );
				}
				
				// fire off the next iteration of our generator after pausing for a second
				if( pauseUntilSaved ) {
					setTimeout( () => {
						agencyGenerator.next();
					}, 1000 );
				}
			});
		})
		.catch( err => {
			// if a error was provided
			if( err ) {
				// we can assume it was a reject from trying to fetch the city or town by an unrecognized name
				cityOrTownNameError.add( err );
			}
			
			// fire off the next iteration of our generator after pausing
			if( pauseUntilSaved ) {
				setTimeout( () => {
					agencyGenerator.next();
				}, 1000 );
			}
		});
};

// instantiates the generator used to create agency records at a regulated rate
const agencyGenerator = exports.generateAgencies();