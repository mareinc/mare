const keystone = require( 'keystone' );

/* fetch a single CSC region contact by their _id field */
exports.getCSCRegionContactById = ( id, fieldsToPopulate = [] ) => {
	return new Promise( ( resolve, reject ) => {
		// if no id was passed in
		if( !id ) {
			// reject the promise with details about the error
			reject( new Error( `no id provided` ) );
		}
		// attempt to find a single CSC region contact matching the passed in registration number
		keystone.list( 'CSC Region Contact' ).model
			.findById( id )
			.populate( fieldsToPopulate )
			.exec()
			.then( CSCRegionContact => {
				// if the target CSC region contact could not be found
				if( !CSCRegionContact ) {
					// reject the promise with details about the error
					return reject( new Error( `no CSC region contact matching id '${ id } could be found` ) );
				}
				// if the target CSC region contact was found, resolve the promise with the model
				resolve( CSCRegionContact );
			// if there was an error fetching from the database
			}, err => {
				// reject the promise with details about the error
				reject( new Error( `error fetching CSC region contact matching id ${ id }` ) );
			});
	});
};