 const keystone	= require( 'keystone' );
 const Agency	= keystone.list( 'Agency' );

// TODO: this implementation is ugly, it needs to be rewritten in a non-crappy way
exports.getAgencyById = ( id, container, field, done ) => { 
	// if the id isn't set
	if( !id ) {
		// return control to the calling context
		return done();
	}
	// fetch the agency record
	Agency.model.findById( id )
		.exec()
		.then( agency => {
			// set the field from the outer context to the agency
			container[ field ] = agency;
			// return control to the parent context
			done();
		});
 }