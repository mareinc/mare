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

exports.getCSCRegionContactByRegion = ( { region, fieldsToPopulate } ) => {

    return new Promise( ( resolve, reject ) => {
        // if no region id was passed in
        if( !region ) {
            // reject the promise with details of the error
            return reject( new Error( `no region provided` ) );
        }

        keystone.list( 'CSC Region Contact' ).model
            .findOne()
            .select( 'cscRegionContact' )
            .where( 'region', region )
            .populate( fieldsToPopulate )
            .exec()
            .then( CSCRegionContact => {
                // if no matching CSC region contact was found in the database
                if( !CSCRegionContact ) {
                    // reject the promise with the reason for the rejection
                    return reject( new Error( `no CSC region contact found for the region with id ${ region }` ) );
                }
                // resolve the promise with an object containing the name and email address of the target contact
                resolve( CSCRegionContact );
            // if there was an error fetching data from the database
            }, err => {
                // reject the promise with the reason for the rejection
                reject( new Error( `error fetching CSC region contact for the region with id ${ region }` ) );
            });
    });
};