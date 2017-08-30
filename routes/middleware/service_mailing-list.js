const keystone		= require( 'keystone' ),
	  MailingList	= keystone.list( 'Mailing List' );

exports.getRegistrationMailingLists = () => {

	return new Promise( ( resolve, reject ) => {

		MailingList.model
			.find( { $or: [
						{ 'showOnSiteVisitorRegistrationPage': true },
						{ 'showOnSocialWorkerRegistrationPage': true },
						{ 'showOnFamilyRegistrationPage': true } ] } )
			.exec()
			.then( mailingLists => {
				// if no mailing lists could not be found
				if( mailingLists.length === 0 ) {
					// log an error for debugging purposes
					console.error( `no mailing lists could be found` );
					// reject the promise
					return reject();
				}
				// if mailing lists were successfully returned, resolve with the array
				resolve( mailingLists );
			// if an error was encountered fetching from the database
			}, err => {
				// log the error for debugging purposes
				console.error( `error fetching the mailing lists for the registration page - ${ err }` );
				// reject the promise
				reject();
			});
	});
};
