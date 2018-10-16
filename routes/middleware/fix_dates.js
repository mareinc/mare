const keystone		= require( 'keystone' ),
	  moment		= require( 'moment' ),
	  middleware	= require( './middleware' );

exports.fixDates = async function( req, res, next ) {
	// if the user is trying to run this script against the production database
	if( /^.*\/production.*$/.test( process.env.MONGO_URI ) ) {
		// alert them of what they're doing and how to get around this message
		return res.send(`
		
			WARNING:
		
			You are running this script against the production database.
		
			To allow execution, open fix_dates.js and comment out the if block in fixDates()` );
	}
	
	try {
		// await fixModelDates( { targetModel: 'Event', fields: [ 'startDate', 'endDate' ] } );
		//// await fixModelDates( { targetModel: 'Account Verification Code', fields: [ 'dateSent' ] } );
		await fixModelDates( { targetModel: 'Child', fields: [ 'visibleInGalleryDate', 'registrationDate', 'birthDate', 'statusChangeDate', 'dateMovedToResidence', 'photolistingWriteupDate', 'photolistingPhotoDate', 'dateOfLastPhotoListing', 'videoSnapshotDate', 'onAdoptuskidsDate', 'wednesdaysChildDate', 'wednesdaysChildSiblingGroupDate', 'coalitionMeetingDate', 'matchingEventDate' ] } );	
		//// await fixModelDates( { targetModel: 'Donation', fields: [ 'date' ] } );
		//// await fixModelDates( { targetModel: 'Inquiry', fields: [ 'takenOn' ] } );
		//// await fixModelDates( { targetModel: 'Internal Note', fields: [ 'date' ] } );
		// await fixModelDates( { targetModel: 'Match', fields: [ 'matchDate' ] } );
		// await fixModelDates( { targetModel: 'Media Feature', fields: [ 'date' ] } );
		// await fixModelDates( { targetModel: 'Placement', fields: [ 'placementDate' ] } );
		//// await fixModelDates( { targetModel: 'Child History', fields: [ 'date' ] } );
		//// await fixModelDates( { targetModel: 'Family History', fields: [ 'date' ] } );
		//// await fixModelDates( { targetModel: 'Social Worker History', fields: [ 'date' ] } );
		// await fixModelDates( { targetModel: 'Family', fields: [ 'homestudyVerifiedDate', 'initialContact', 'contact1.birthDate', 'contact2.birthDate', 'child1.birthDate', 'child2.birthDate', 'child3.birthDate', 'child4.birthDate', 'child5.birthDate', 'child6.birthDate', 'child7.birthDate', 'child8.birthDate', 'stages.gatheringInformation.date', 'stages.lookingForAgency.date', 'stages.workingWithAgency.date', 'stages.MAPPTrainingCompleted.date', 'homestudy.initialDate', 'homestudy.mostRecentDate', 'onlineMatching.date', 'registeredWithMARE.date', 'familyProfile.date', 'closed.date', 'infoPacket.date' ] } );
		//// await fixModelDates( { targetModel: 'Site Visitor', fields: [ 'infoPacket.date' ] } );
	}
	catch( error ) {
		console.log( `error saving models: ${ error }` );
	}
};

/* loops through every record, resaving them */
async function fixModelDates( { targetModel, fields, page = 1 } ) {
	// create an array to store errors
	let promises = [],
		errors = [];

	while( page ) {
		console.info( `saving ${ targetModel.toLowerCase() }s ${ ( page - 1 ) * 100 } - ${ page * 100 }` );

		// fetch the page, waiting to execute further code until we have a result
		const response = await fetchModelsByPage( targetModel, page );

		// if there was an error fetching the page of models
		if( response.error ) {
			errors.push( response.error )
		}

		// loop through each of the returned event models
		for( let model of response.models ) {
			// loop through the date fields to update
			for( field of fields ) {

				if( model.get( field ) ) {
					const lastSpace = model.get( field ).toString().lastIndexOf( ' ' );
					const hoursToAdd = model.get( field ).toString().substr( lastSpace - 3, 1 );

					model.set( field, moment( model.get( field ) ).add( Number.parseInt( hoursToAdd ), 'h' ).toDate() );
				}
			}

			try {
				await saveModel( model );
			}
			catch( error ) {
				errors.push( `error on page ${ page } of model ${ targetModel } - ${ error }` );
			}
		}

		// increment the page to fetch for the next run, or set it to false if there are no more pages to fetch
		page = response.nextPage;
	}
	// loop through each saved error
	for( let error of errors ) {
		// log the error for debugging purposes
		console.error( error );
	}
};

function fetchModelsByPage( model, page ) {

	return new Promise( ( resolve, reject ) => {
		// fetch the request page of child records
		keystone.list( model )
			.paginate ({
				page: page || 1,
				perPage: 100
			})
			.exec ( ( err, models ) => {

				// if there was an error
				if( err ) {
					// resolve the promise with the error and the next page to fetch ( false if this is the last page )
					// NOTE: this is as error handling is processed in the calling function
					return resolve({
						error: err,
                        nextPage: models.next
                    });
                }
                
                // if the models were fetched successfully, resolve the promise with the models and the next page to fetch ( false if this is the last page )
                resolve({
                    models: models.results,
                    nextPage: models.next
                });
			});
	});
}

function saveModel( model ) {

	return new Promise( ( resolve, reject ) => {
		// attempt the save the model
		model.save( ( err, savedModel ) => {
			// if we run into an error
			if( err ) {
				// reject the promise with details about the error
				reject( err );
			// if the model saved successfully
			} else {
				// resolve the promise
				resolve();
			}
		});
	});
};
