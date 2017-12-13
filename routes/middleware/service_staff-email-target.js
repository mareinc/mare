const keystone = require( 'keystone' );

exports.getTargetId = emailTarget => {

	return new Promise( ( resolve, reject ) => {

		keystone.list( 'Staff Email Target' ).model
			.findOne()
			.select( '_id' )
			.where( 'staffEmailTarget', emailTarget )
			.exec()
			.then( target => {
				// if no target was found in the database
				if( !target ) {
					// reject the promise with the reason for the rejection
					return reject( `no staff target found for ${ emailTarget }` );
				}
				// resolve the promise the the database id of the staff email target
				resolve( target.get( '_id' ) );
			// if there was an error fetching data from the database
            }, err => {
                // reject the promise with the reason for the rejection
                reject( `error fetching staff email target for ${ emailTarget }` );
            });
	});
}