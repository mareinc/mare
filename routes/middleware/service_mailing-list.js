const keystone = require( 'keystone' );

exports.getRegistrationMailingLists = () => {

	return new Promise( ( resolve, reject ) => {

		keystone.list( 'Mailing List' ).model
			.find( { $or: [
				{ 'showOnSiteVisitorRegistrationPage': true },
				{ 'showOnSocialWorkerRegistrationPage': true },
				{ 'showOnFamilyRegistrationPage': true } ] } )
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
			// if an error was encountered fetching from the database
			}, err => {
				// log the error for debugging purposes
				console.error( `error fetching the mailing lists for the registration page - ${ err }` );
				// reject the promise
				reject();
			});
	});
};

exports.getMailingListsByUserType = userType => {

	return new Promise( ( resolve, reject ) => {
		let query;
		
		switch( userType ) {
			case 'social worker'	: query = { 'showOnSocialWorkerRegistrationPage': true }; break;
			case 'site visitor'		: query = { 'showOnSiteVisitorRegistrationPage': true }; break;
			case 'family'			: query = { 'showOnFamilyRegistrationPage': true }; break;
			default					: return resolve( [] );
		}

		keystone.list( 'Mailing List' ).model
			.find( query )
			.exec()
			.then( mailingLists => {
				// if no mailing lists could not be found
				if( mailingLists.length === 0 ) {
					// log a message for debugging purposes
					console.log( `no mailing lists could be found for user type ${ userType }` );
					// resolve the promise
					return resolve( [] );
				}
				// if mailing lists were successfully returned, resolve with the array
				resolve( mailingLists );
			// if an error was encountered fetching from the database
			}, err => {
				// log the error for debugging purposes
				console.error( `error fetching the mailing lists by user type ${ userType } - ${ err }` );
				// reject the promise
				reject();
			});
	});
};