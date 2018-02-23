const keystone					= require( 'keystone' );
const Inquiry 					= keystone.list( 'Inquiry' );
// utility middleware
const utilityModelFetch			= require( './utilities_model-fetch' );
// csv conversion middleware
const CSVConversionMiddleware	= require( './utilities_csv-conversion' );

// create an array to hold all mailing lists.  This is created here to be available to multiple functions below
let mailingListSubscriptions;
// create references to the map we stored on locals.  This is bound here to be available to multiple functions below since res can't be passed to the generator
let mailingListsMap;
// create an object to hold the mailing list subscriptions
let newMailingListSubscriptionMap = {};
// expose done to be available to all functions below
let mailingListSubscriptionsImportComplete;
// expose the array storing progress through the migration run
let migrationResults;
// create an array to store problems during the import
let importErrors = [];

module.exports.importMailingListSubscriptions = ( req, res, done ) => {
	// expose the map we'll need for this import
	mailingListsMap = res.locals.migration.maps.mailingLists;
	// expose done to our generator
	mailingListSubscriptionsImportComplete = done;
	// expose our migration results array
	migrationResults = res.locals.migrationResults;

	// create a promise for converting the mailing list subscriptions CSV file to JSON
	const mailingListSubscriptionsLoaded = CSVConversionMiddleware.fetchMailingListSubscriptions();

	// if the file was successfully converted, it will return the array of mailing list subscriptions
	mailingListSubscriptionsLoaded.then( mailingListSubscriptionsArray => {
		// store the mailing list subscriptions in a variable accessible throughout this file
		mailingListSubscriptions = mailingListSubscriptionsArray;
		// call the function to build the sibling map
		exports.buildMailingListSubscriptionsMap();
		// kick off the first run of our generator
		mailingListSubscriptionGenerator.next();
	// if there was an error converting the mailing list subscriptions file
	}).catch( reason => {
		console.error( `error processing mailing list subscriptions` );
		console.error( reason );
		// aborting the import
		return done();
	});
};

module.exports.buildMailingListSubscriptionsMap = () => {
	// if it has a mailing list id of 12, ignore it as video libraries was removed
	// load all mailing list subscriptions
	for( let mailingListSubscription of mailingListSubscriptions ) {
		// for each mailing list attendee, get the inquiry id
		const mailingListId = mailingListSubscription.mlt_id;
		// if this row is about the video library mailing list, ignore it
		if( mailingListId === '12' ) {
			continue;
		}

		const familyId = mailingListSubscription.fam_id,
			  socialWorkerId = mailingListSubscription.agc_id,
			  outsideContactId = mailingListSubscription.ocn_id;

		const subscriberId = familyId ? familyId :
							 socialWorkerId ? socialWorkerId :
							 outsideContactId ? outsideContactId :
							 undefined;
		
		const subscriberGroup = familyId ? 'families' :
							  	socialWorkerId ? 'socialWorkers' :
							  	outsideContactId ? 'outsideContacts' :
							  	undefined;

		// if the key already exists
		if( !newMailingListSubscriptionMap[ mailingListId ] ) {
			// initialize values for the different subscriber groups
			newMailingListSubscriptionMap[ mailingListId ] = {
				families: new Set(),
				socialWorkers: new Set(),
				outsideContacts: new Set()
			};
		}
		// add the value to the correct Set in the map
		newMailingListSubscriptionMap[ mailingListId ][ subscriberGroup ].add( subscriberId );
	}
};

/* a generator to allow us to control the processing of each record */
module.exports.generateMailingListSubscriptions = function* generateMailingListSubscriptions() {

	console.log( `creating mailing list subscriptions in the new system` );
	// create monitor variables to assess how many records we still need to process
	let totalRecords					= Object.keys( newMailingListSubscriptionMap ).length,
		remainingRecords 				= totalRecords,
		batchCount						= 200, // number of records to be process simultaneously
		mailingListSubscriptionNumber	= 0; // keeps track of the current mailing list subscription number being processed.  Used for batch processing
	// loop through each mailing list group object we need to create a record for
	for( let key in newMailingListSubscriptionMap ) {
		// increment the mailingListSubscriptionNumber
		mailingListSubscriptionNumber++;
		// if we've hit a multiple of batchCount, pause execution to let the current records process
		if( mailingListSubscriptionNumber % batchCount === 0 ) {
			yield exports.createMailingListSubscriptionRecord( key, newMailingListSubscriptionMap[ key ], true );
		} else {
			exports.createMailingListSubscriptionRecord( key, newMailingListSubscriptionMap[ key ], false );
		}
		// decrement the counter keeping track of how many records we still need to process
		remainingRecords--;

		if( remainingRecords % 200 === 0 ) {
			console.log( `mailing list subscriptions remaining: ${ remainingRecords }` );
		}
		// if there are no more records to process call done to move to the next migration file
		if( remainingRecords === 0 ) {
			
			console.log( `the following records weren't saved correctly:` );

			importErrors.forEach( error => {
				console.log( error )
			});

			const resultsMessage = `finished creating ${ totalRecords } mailing list subscriptions in the new system`;
			// store the results of this run for display after the run
			migrationResults.push({
				dataSet: 'Mailing List Subscriptions',
				results: resultsMessage
			});
			
			console.log( resultsMessage );
			// return control to the data migration view
			return mailingListSubscriptionsImportComplete();
		}
	}
};

/* the import function for agencies */
module.exports.createMailingListSubscriptionRecord = ( mailingListId, subscribers, pauseUntilSaved ) => {

	const familiesArray = [ ...subscribers.families ],
		  socialWorkersArray = [ ...subscribers.socialWorkers ],
		  outsideContactsArray = [ ...subscribers.outsideContacts ];

	// fetch the mailing list
	const mailingListLoaded = utilityModelFetch.getMailingListById( mailingListsMap[ mailingListId ] );
	// fetch the family subscribers
	const familiesLoaded = utilityModelFetch.getFamiliesByRegistrationNumbers( familiesArray );
	// fetch the social worker subscribers
	const socialWorkersLoaded = utilityModelFetch.getSocialWorkersByOldIds( socialWorkersArray );
	// fetch the outside contact subscribers
	const outsideContactsLoaded = utilityModelFetch.getOutsideContactsByOldIds( outsideContactsArray );

	mailingListLoaded
		.then( mailingList => {

			Promise.all( [ familiesLoaded, socialWorkersLoaded, outsideContactsLoaded ] )
				.then( values => {

					const [ families, socialWorkers, outsideContacts ] = values;

					mailingList.familySubscribers = families ? families.map( family => family.get( '_id' ) ) : [];
					mailingList.socialWorkerSubscribers = socialWorkers ? socialWorkers.map( socialWorker => socialWorker.get( '_id' ) ) : [];
					mailingList.outsideContactSubscribers = outsideContacts ? outsideContacts.map( outsideContact => outsideContact.get( '_id' ) ) : [];

					// save the updated family record
					mailingList.save( ( err, savedModel ) => {
						// if we run into an error
						if( err ) {
							// store a reference to the entry that caused the error
							importErrors.push( { id: mailingListId, error: err } );
						}

						// fire off the next iteration of our generator after pausing
						if( pauseUntilSaved ) {
							setTimeout( () => {
								eventAttendeeGenerator.next();
							}, 1000 );
						}
					})
				})
				.catch( err => {
					// push the error to the importErrors array for display after the import has finished running
					importErrors.push( { id: mailingListId, error: `error loading mailing list - ${ err }` } );

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
			importErrors.push( { id: mailingListId, error: `error loading mailing list - ${ err }` } );

			// fire off the next iteration of our generator after pausing
			if( pauseUntilSaved ) {
				setTimeout( () => {
					eventAttendeeGenerator.next();
				}, 1000 );
			}
		});
};

// instantiates the generator used to create agency records at a regulated rate
const mailingListSubscriptionGenerator = exports.generateMailingListSubscriptions();