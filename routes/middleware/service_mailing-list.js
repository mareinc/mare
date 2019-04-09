const keystone = require( 'keystone' );

exports.getMailingLists = () => {

	return new Promise( ( resolve, reject ) => {

		keystone.list( 'MailChimpList' ).model
			.find()
			.exec()
			.then( mailingLists => {
				// if no mailing lists could not be found
				if( mailingLists.length === 0 ) {
					// log a message for debugging purposes
					console.log( `no mailing lists could be found` );
					// resolve the promise
					return resolve( [] );
				}
				// if mailing lists were successfully returned, resolve with the array
				resolve( mailingLists );
            })
            .catch( err => {
				// log the error for debugging purposes
				console.error( `error fetching mailing lists`, err );
				// reject the promise
				reject();
			});
	});
};
