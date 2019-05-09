 const keystone	= require( 'keystone' );

exports.getAgencyById = id => {

	return new Promise( ( resolve, reject ) => {
		// if no id was passed in
		if( !id ) {
			// return control to the calling context
			return reject( new Error( `error fetching agency by id - no id value passed in` ) );
		}
		// fetch the agency record
		keystone.list( 'Agency' ).model
			.findById( id )
			.exec()
			.then( agency => {
				// if no agency was found with a matching id
				if( !agency ) {
					// reject the promise with the reason why
					reject( new Error( `error fetching agency by id - no agency found with id ${ id }` ) );
				}
				// resolve the promise with the returned agency
				resolve( agency );
			// if an error occurred fetching from the database
			}, err => {
				// reject the promise with details of the error
				reject( new Error( `error fetching agency by id ${ id }` ) );
			});
	});
};

/* Cron job function used to batch save all agency models */
exports.saveAllAgencies = () => {

	return new Promise( ( resolve, reject ) => {

		keystone.list( 'Agency' ).model
			.find()
			.then( async agencies => {
				// create an array of errors to display once all models have been saved
				let errors = [];
				// loop through each agency
				for( let [ index, agency ] of agencies.entries() ) {

					if( index % 100 === 0 ) {
						console.log( `saving agency ${ index } of ${ agencies.length }` );
					}

					try {
						await agency.save();
					}
					catch( err ) {
						errors.push( `error saving agency ${ agency.code } - ${ err }` );
					}
				};
				// log each of the errors to the console
				for( let error of errors ) {
					console.error( error );
				}

				// if there were errors, resolve the promise with an error state and return the errors
				if( errors.length > 0 ) {
					return resolve( {
						status: 'errors',
						errors
					});
				}
				// if there were no errors, resolve the pormise with a success state
				return resolve({
					status: 'success'
				});

			}, err => {

				console.error( `cron: error fetching agencies for nightly cron job`, err );
				reject();
			});	
	});
};