 const keystone	= require( 'keystone' );

exports.getAgencyById = id => {

	return new Promise( ( resolve, reject ) => {
		// if no id was passed in
		if( !id ) {
			// return control to the calling context
			return reject( `error fetching agency by id - no id value passed in` );
		}
		// fetch the agency record
		keystone.list( 'Agency' ).model
			.findById( id )
			.exec()
			.then( agency => {
				// if no agency was found with a matching id
				if( !agency ) {
					// reject the promise with the reason why
					reject( `error fetching agency by id - no agency found with id ${ id }`)
				}
				// resolve the promise with the returned agency
				resolve( agency );
			// if an error occurred fetching from the database
			}, err => {
				// reject the promise with details of the error
				reject( `error fetching agency by id ${ id } - ${ err }` );
			});
	});
 }