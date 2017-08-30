const keystone		= require( 'keystone' ),
	  Child			= require( '../../models/Child' ),
	  SocialWorker	= keystone.list( 'Social Worker' );
 
// TODO: this implementation is ugly, it needs to be rewritten in a non-crappy way
exports.getSocialWorkerById = ( id, container, field, done ) => { 
	// if the id isn't set
	if( !id ) {
		// return control to the calling context
		return done();
	}
	// fetch the social worker record
	SocialWorker.model.findById( id )
		.exec()
		.then( socialWorker => {
			// set the field from the outer context to the social worker
			container[ field ] = socialWorker;
			// return control to the parent context
			done();
		});
};

exports.fetchRegisteredChildren = ( id ) => {

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
			.lean()
			.exec()
			.then( children => {
				resolve( children );
			}, err => {
				// log the error for debugging purposes
				console.error( `an error occurred fetching the children registered by social worker with id ${ id } - ${ err }` );
				// allow further processing beyond this middleware
				reject();
			});
	});
}