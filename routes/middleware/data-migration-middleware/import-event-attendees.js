const keystone					= require( 'keystone' );
const Event 					= keystone.list( 'Event' );
// utility middleware
const utilityFunctions			= require( './utilities_functions' );
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all event attendees.  This is created here to be available to multiple functions below
let eventAttendees;
// create an object to hold the disability preferences
let newEventAttendeesMap = {};
// create references to the map we stored on locals.  This is bound here to be available to multiple functions below since res can't be passed to the generator
let eventAttendeeTypeMap;
// expose done to be available to all functions below
let eventAttendeesImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.appendEventAttendees = ( req, res, done ) => {
	// expose the map we'll need for this import
	eventAttendeeTypeMap = res.locals.migration.maps.eventAttendeeTypes;
	// expose done to our generator
	eventAttendeesImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the event attendees CSV file to JSON
	const eventAttendeesLoaded = CSVConversionMiddleware.fetchEventAttendees();

	// if the file was successfully converted, it will return the array of event attendees
	eventAttendeesLoaded.then( eventAttendeesArray => {
		// store the event attendees in a variable accessible throughout this file
		eventAttendees = eventAttendeesArray;
		// call the function to build the sibling map
		exports.buildEventAttendeesMap();
		// kick off the first run of our generator
		eventAttendeeGenerator.next();
	// if there was an error converting the event attendees file
	}).catch( reason => {
		console.error( `error processing event attendees` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

module.exports.buildEventAttendeesMap = () => {
	// load all event attendees
	for( let eventAttendee of eventAttendees ) {
		// for each event attendee, get the event id
		const eventId = eventAttendee.evt_id;
	 	// and use the id as a key, and add each event attendee's _id in a key object
		if( eventId ) {

			const type = eventAttendee.type;

			const attendeeData = {
				type,
				id: type === 'C' ? eventAttendee.chd_id :
					type === 'F' ? eventAttendee.fam_id :
					type === 'S' ? eventAttendee.agc_id :
					''
			};

			if( newEventAttendeesMap[ eventId ] ) {

				newEventAttendeesMap[ eventId ].add( attendeeData );

			} else {

				let newEventAttendeeSet = new Set( [ attendeeData ] );
				// create an entry containing a set with the one event attendee
				newEventAttendeesMap[ eventId ] = newEventAttendeeSet;
			}
		}
	}
};

/* a generator to allow us to control the processing of each record */
module.exports.generateEventAttendees = function* generateEventAttendees() {

	console.log( `creating event attendees in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords						= Object.keys( newEventAttendeesMap ).length,
		remainingRecords 					= totalRecords,
		batchCount							= 10, // number of records to be process simultaneously
		eventAttendeeNumber	= 0; // keeps track of the current event attendee number being processed.  Used for batch processing
	// loop through each event attendee object we need to create a record for
	for( let key in newEventAttendeesMap ) {
		// increment the eventAttendeeNumber
		eventAttendeeNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( eventAttendeeNumber % batchCount === 0 ) {
			yield exports.updateEventRecord( newEventAttendeesMap[ key ], key, true );
		} else {
			exports.updateEventRecord( newEventAttendeesMap[ key ], key, false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;
		console.log( `event attendee groups remaining: ${ remainingRecords }` );
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {

			console.log( `the following records weren't saved correctly:` );

			importErrors.forEach( error => {
				console.log( error )
			});

			const resultsMessage = `finished appending ${ totalRecords } event attendee groups in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'event attendees',
				results: resultsMessage
			});

			console.log( resultsMessage );
			// return control to the data migration view
			return eventAttendeesImportComplete();
		}
	}
};

// a function paired with the generator to create a record and request the generator to process the next once finished
module.exports.updateEventRecord = ( attendees, eventId, pauseUntilSaved ) => {

	let childIds = [],
		familyIds = [],
		socialWorkerIds = [];

	for( attendee of attendees ) {
		if( attendee.type === 'C' ) childIds.push( attendee.id );
		if( attendee.type === 'F' ) familyIds.push( attendee.id );
		if( attendee.type === 'S' ) socialWorkerIds.push( attendee.id );
	}
	// create a promise
	const eventLoaded = new Promise( ( resolve, reject ) => {
		// for fetching the family
		utilityModelFetch.getEventById( resolve, reject, eventId );
	});
	// create a promise
	const childAttendeesLoaded = new Promise( ( resolve, reject ) => {
		// for fetching the _ids from children
		utilityModelFetch.getChildIdsByRegistrationNumbers( resolve, reject, childIds );
	});
	// create a promise
	const familyAttendeesLoaded = new Promise( ( resolve, reject ) => {
		// for fetching the _ids from families
		utilityModelFetch.getFamilyIdsByRegistrationNumbers( resolve, reject, familyIds );
	});
	// create a promise
	const socialWorkerAttendeesLoaded = new Promise( ( resolve, reject ) => {
		// for fetching the _ids from social workers
		utilityModelFetch.getSocialWorkerIdsByOldIds( resolve, reject, socialWorkerIds );
	});

	Promise.all( [ eventLoaded, childAttendeesLoaded, familyAttendeesLoaded, socialWorkerAttendeesLoaded ] )
		.then( values => {

			const [ event, childAttendees, familyAttendees, socialWorkerAttendees ] = values;

			event.childAttendees = childAttendees;
			event.familyAttendees = familyAttendees;
			event.socialWorkerAttendees = socialWorkerAttendees;

			// save the updated event record
			event.save( ( err, savedModel ) => {
				// if we run into an error
				if( err ) {
					// store a reference to the entry that caused the error
					importErrors.push( { id: event.get( 'name' ), error: err } );
				}

				// fire off the next iteration of our generator after pausing
				if( pauseUntilSaved ) {
					setTimeout( () => {
						eventAttendeeGenerator.next();
					}, 1000 );
				}
			});
		})
		.catch( err => {
			// push the error to the importErrors array for display after the import has finished running
			importErrors.push( { id: eventId, error: `error adding attendees to event - ${ err }` } );

			// fire off the next iteration of our generator after pausing
			if( pauseUntilSaved ) {
				setTimeout( () => {
					eventAttendeeGenerator.next();
				}, 1000 );
			}
		});
};

// instantiates the generator used to create event attendee records at a regulated rate
const eventAttendeeGenerator = exports.generateEventAttendees();