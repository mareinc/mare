const keystone = require( 'keystone' );

exports.getSocialWorkerById = id => {

	return new Promise( ( resolve, reject ) => {
		// if no id was passed in
		if( !id ) {
			// reject the promise with details of the error
			return reject( `no id value provided` );
		}
		// fetch the social worker record
		keystone.list( 'Social Worker' ).model
			.findById( id )
			.exec()
			.then( socialWorker => {
				// if no social worker was found with a matching id
				if( !socialWorker ) {
					// reject the promise with the reason why
					reject( `no social worker found matching id ${ id } could be found` );
				}
				// resolve the promise with the returned social worker
				resolve( socialWorker );
			// if an error occurred fetching from the database
			}, err => {
				// reject the promise with details of the error
				reject( `error fetching social worker matching id ${ id } - ${ err }` );
			});
	});
};

exports.fetchSocialWorkersChildren = id => {

	return new Promise( ( resolve, reject ) => {
		// if the id isn't set
		if( !id ) {
			// resolve the promise with an empty array to prevent downstream array checks from failing
			return resolve( [] );
		}

		keystone.list( 'Child' ).model
			.find( { $or: [
						{ adoptionWorker: id },
						{ recruitmentWorker: id } ] } )
			.populate( 'status' )
			.lean()
			.exec()
			.then( children => {
				// TODO: this can be moved into where statements on the query itself
				// filter out any children that are not active or on hold
				let displayChildren = children.filter( child => child.status.childStatus === 'active' || child.status.childStatus === 'on hold' );
				
				resolve( displayChildren );

			}, err => {
				// log the error for debugging purposes
				console.error( `an error occurred fetching the children registered by social worker with id ${ id } - ${ err }` );
				// allow further processing beyond this middleware
				reject();
			});
	});
};
