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

exports.getAgenciesByIds = ids => {

	return new Promise( ( resolve, reject ) => {
		// if no id was passed in
		if( !Array.isArray( ids ) ) {
			// return control to the calling context
			return reject( new Error( `error fetching agencies by ids - no ids value passed in` ) );
		}
		// fetch the agency records
		keystone.list( 'Agency' ).model
			.find( {
				'_id': { $in: ids }
			})
			.exec()
			.then( agencies => {
				// if no agency was found with a matching ids
				if( !agencies ) {
					// reject the promise with the reason why
					reject( new Error( `error fetching agencies by id - no agencies found with the ids` ) );
				}
				// resolve the promise with the returned agencies
				resolve( agencies );
			// if an error occurred fetching from the database
			}, err => {
				// reject the promise with details of the error
				reject( new Error( `error fetching agencies by id ${ id }` ) );
			});
	});
};

/* get all agencies that match the query in the name field and sort them by name */
exports.getAgenciesByName = ( nameQuery, maxResults ) => {

	return new Promise( ( resolve, reject ) => {
		// if no maxResults was passed in
		if( !maxResults ) {
			// return control to the calling context
			return reject( new Error( `error fetching agencies by name - no maxResults passed in` ) );
		}
		
		// fetch the agency records
		keystone.list( 'Agency' ).model
			.find( {
				'name' : new RegExp( nameQuery, 'i' )
			})
			.sort( {
				'name' : 'asc'
			})
			.limit( maxResults )
			.exec()
			.then( agencies => {
				// resolve the promise with the returned agencies
				resolve( agencies );
			}, err => {
				// log an error for debugging purposes
				console.error( `error fetching agencies by name ${ nameQuery } and max results ${ maxResults }`, err );
				// reject the promise with details about the error
				reject( new Error( `error fetching agencies by name ${ nameQuery } and max results ${ maxResults } - ${ err }` ) );
			});
	});
};

/* get all agencies that match the query in the code field and sort them by code */
exports.getAgenciesByCode = ( codeQuery, maxResults ) => {

	return new Promise( ( resolve, reject ) => {
		// if no maxResults was passed in
		if( !maxResults ) {
			// return control to the calling context
			return reject( new Error( `error fetching agencies by code - no maxResults passed in` ) );
		}
		
		// fetch the agency records
		keystone.list( 'Agency' ).model
			.find( {
				'code' : new RegExp( codeQuery, 'i' )
			})
			.sort( {
				'code' : 'asc'
			})
			.limit( maxResults )
			.exec()
			.then( agencies => {
				// resolve the promise with the returned agencies
				resolve( agencies );
			}, err => {
				// log an error for debugging purposes
				console.error( `error fetching agencies by code ${ codeQuery } and max results ${ maxResults }`, err );
				// reject the promise with details about the error
				reject( new Error( `error fetching agencies by code ${ codeQuery } and max results ${ maxResults } - ${ err }` ) );
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