const keystone					= require( 'keystone' );
const Event 					= keystone.list( 'Event' );
// utility middleware
const utilityFunctions			= require( './utilities_functions' );
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all events.  This is created here to be available to multiple functions below
let events;
// expose done to be available to all functions below
let eventImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.importEvents = ( req, res, done ) => {
	// expose done to our generator
	eventImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the events CSV file to JSON
	const eventsLoaded = CSVConversionMiddleware.fetchEvents();

	// if the file was successfully converted, it will return the array of events
	eventsLoaded.then( eventsArray => {
		// store the events in a variable accessible throughout this file
		events = eventsArray;
		// kick off the first run of our generator
		eventGenerator.next();
	// if there was an error converting the events file
	}).catch( reason => {
		console.error( `error processing events` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

/* a generator to allow us to control the processing of each record */
module.exports.generateEvents = function* generateEvents() {

	console.log( `creating events in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords		= events.length,
		remainingRecords 	= totalRecords,
		batchCount			= 300, // number of records to be process simultaneously
		eventNumber	= 0; // keeps track of the current event number being processed.  Used for batch processing
	// loop through each event object we need to create a record for
	for( let event of events ) {
		// increment the eventNumber
		eventNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( eventNumber % batchCount === 0 ) {
			yield exports.createEventRecord( event, true );
		} else {
			exports.createEventRecord( event, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `events remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			console.log( `the following records weren't saved correctly:` );

			importErrors.forEach( error => {
				console.log( error )
			});

			const resultsMessage = `finished creating ${ totalRecords } events in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Events',
				results: resultsMessage
			});
			
			console.log( resultsMessage );
			// return control to the data migration view
			return eventImportComplete();
		}
	}
};

/* the import function for events */
module.exports.createEventRecord = ( event, pauseUntilSaved ) => {

	const eventDateTime = new Date( event.schedule_datetime );
	const eventStartDate = eventDateTime.toLocaleDateString();
	const eventStartString = eventDateTime.toLocaleTimeString();
	const eventEnd = eventDateTime.setHours( eventDateTime.getHours() + 1 );
	const eventEndString = new Date( eventEnd ).toLocaleTimeString();
	const eventStartTime = eventStartString.substr( 0, eventStartString.lastIndexOf( ':' ) ) + eventStartString.substr( eventStartString.lastIndexOf( ':' ) + 4 ).toLowerCase();
	const eventEndTime = eventEndString.substr( 0, eventEndString.lastIndexOf( ':' ) ) + eventEndString.substr( eventEndString.lastIndexOf( ':' ) + 4 ).toLowerCase();

	let eventPostfix = '';

	if( [ '5', '93', '1076', '1077', '1078' ].includes( event.rcs_id ) ) {
		eventPostfix += ` - ${ eventStartDate }`;
	}

	// create a promise
	const sourceLoaded = new Promise( ( resolve, reject ) => {
		// for fetching the recruitment source
		utilityModelFetch.getSourceById( resolve, reject, event.rcs_id );
	});
	// if the source was loaded successfully
	sourceLoaded
		.then( source => {
			// populate fields of a new Event object
			let newEvent = new Event.model({
				name: source.get( 'source' ) + eventPostfix,
				isActive: event.is_active === 'Y',

				type: 'MARE adoption parties & information events',

				startDate: eventStartDate,
				endDate: eventStartDate,
				startTime: eventStartTime,
				endTime: eventEndTime,

				notes: event.notes,

				// this is used to determine whether we should send an automatic email to the creator when their event becomes active
				createdViaWebsite: false,

				oldId: event.evt_id
			});

			newEvent.save( ( err, savedModel ) => {
				// if we run into an error
				if( err ) {
					// store a reference to the entry that caused the error
					importErrors.push( { id: event.evt_id, error: err } );
				}
				
				// fire off the next iteration of our generator after pausing for a second
				if( pauseUntilSaved ) {
					setTimeout( () => {
						eventGenerator.next();
					}, 1000 );
				}
			});
		})
		.catch( err => {
			// push the error to the importErrors array for display after the import has finished running
			importErrors.push( { id: undefined, error: `error importing event - could not load source with id ${ event.rcs_id } - ${ err }` } );

			// fire off the next iteration of our generator after pausing
			if( pauseUntilSaved ) {
				setTimeout( () => {
					eventGenerator.next();
				}, 1000 );
			}
		});
};

// instantiates the generator used to create event records at a regulated rate
const eventGenerator = exports.generateEvents();