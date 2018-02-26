const keystone = require( 'keystone' );
// TODO: this function isn't written correctly, replace references to it with getEmailTargetByName() below
exports.getTargetId = emailTarget => {

	return new Promise( ( resolve, reject ) => {

		keystone.list( 'Email Target' ).model
			.findOne()
			.select( '_id' )
			.where( 'emailTarget', emailTarget )
			.exec()
			.then( target => {
				// if no target was found in the database
				if( !target ) {
					// reject the promise with the reason for the rejection
					return reject( `no target found for ${ emailTarget }` );
				}
				// resolve the promise the the database id of the email target
				resolve( target.get( '_id' ) );
			// if there was an error fetching data from the database
            }, err => {
                // reject the promise with the reason for the rejection
                reject( `error fetching email target for ${ emailTarget }` );
            });
	});
};

exports.getEmailTargetByName = emailTarget => {

	return new Promise( ( resolve, reject ) => {

		keystone.list( 'Email Target' ).model
			.findOne()
			.where( 'emailTarget', emailTarget )
			.exec()
			.then( emailTarget => {
				// if the email target could not be found
				if( !emailTarget ) {
					// reject the promise with the reason for the rejection
					return reject( `no email target matching ${ emailTarget } could be found` );
				}
				// if the email target was found, resolve the promise with the returned model
				resolve( emailTarget );
			// if there was an error fetching data from the database
            }, err => {
                // reject the promise with the reason for the rejection
                reject( `error fetching email email target matching ${ emailTarget } - ${ err }` );
            });
	});
};